// Real layout check jest can't do: types across wrap points in headless Firefox and compares the cursor
// to the end of the rendered text. Run after a build: node test/browser/wrap-check.mjs
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, extname, normalize } from "node:path"

const WIDTHS = [390, 1280]
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" }

const page = `<!doctype html><body><script>
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function run(width) {
  const f = document.createElement("iframe")
  f.style.cssText = "width:" + width + "px;height:600px;border:0"
  f.src = "/index.html"
  document.body.appendChild(f)
  while(!f.contentWindow.stdin) await sleep(50)
  await sleep(500)
  const w = f.contentWindow, d = f.contentDocument
  const out = d.getElementById("console_output"), cur = d.getElementById("cursor")
  const end = () => {
    let n = out; while(n.lastChild) n = n.lastChild
    const r = d.createRange(); r.setStart(n, n.length - 1); r.setEnd(n, n.length)
    const rects = r.getClientRects(); return rects[rects.length - 1]
  }
  const lineH = 15, edge = out.getBoundingClientRect().right
  const bad = []; let typed = 0
  const type = async (ch, label) => {
    const before = cur.getBoundingClientRect()
    w.stdin.write(ch.charCodeAt(0)); typed++
    await sleep(45)
    const c = cur.getBoundingClientRect(), e = end()
    const sameLine = Math.abs(c.top - e.top) <= lineH / 2 + 2 && Math.abs(c.left - e.right) <= 1.5
    const nextLine = e.right + c.width > edge - 1 && Math.abs(c.top - e.top - lineH) <= lineH / 2 + 2 && c.left < e.left
    const moved = c.left !== before.left || c.top !== before.top
    if(!moved || !(sameLine || nextLine) || e.right > edge + 1)
      bad.push(label + "#" + typed + " " + JSON.stringify(ch) + " moved=" + moved + " cur=" + c.left.toFixed(1) + "," + c.top.toFixed(1) +
        " end=" + e.right.toFixed(1) + "," + e.top.toFixed(1) + " edge=" + edge.toFixed(1))
  }
  const cols = Math.ceil(out.clientWidth / 8) + 5
  for(let i = 0; i < cols; i++) await type(i % 5 === 4 ? " " : "w", "words")
  for(let i = 0; i < cols + 5; i++) await type(" ", "spaces")
  for(let i = 0; i < cols + 5; i++) await type("a", "longword")
  f.remove()
  return { width, typed, failures: bad.length, first: bad.slice(0, 6) }
}
(async () => {
  const results = []
  for(const width of ${JSON.stringify(WIDTHS)}) results.push(await run(width))
  await fetch("/report", { method: "POST", body: JSON.stringify(results) })
})().catch((e) => fetch("/report", { method: "POST", body: JSON.stringify({ error: String(e) }) }))
</script></body>`

const profile = mkdtempSync(join(tmpdir(), "wrapcheck-"))
let firefox
const finish = (text, code) => {
  console.log(text)
  firefox?.kill()
  setTimeout(() => { rmSync(profile, { recursive: true, force: true }); process.exit(code) }, 500)
}
const server = createServer(async (req, res) => {
  const path = req.url.split("?")[0]
  if(path === "/harness") { res.setHeader("content-type", "text/html"); return res.end(page) }
  if(path === "/report") {
    let body = ""
    for await (const c of req) body += c
    res.end()
    const r = JSON.parse(body)
    return finish(JSON.stringify(r, null, 1), r.error || r.some((x) => x.failures) ? 1 : 0)
  }
  try {
    const file = await readFile(join("public", normalize(path)))
    res.setHeader("content-type", TYPES[extname(path)] ?? "application/octet-stream")
    res.end(file)
  } catch { res.statusCode = 404; res.end() }
})
server.listen(0, "127.0.0.1", () => {
  firefox = spawn("firefox", ["--headless", "--no-remote", "--profile", profile,
    `http://127.0.0.1:${server.address().port}/harness`], { stdio: "ignore" })
})
setTimeout(() => finish("timed out", 2), 240000)
