import { run } from "../helpers"
import { GithubBlogFilesystem } from "../../src/filesystem/githubBlogFs"
import { FilesystemDirNode, FilesystemLeafNode, FilesystemNode } from "../../src/filesystem/core"
import { Decode } from "../../src/commands/decode"
import { Strings } from "../../src/commands/strings"
import { Cat } from "../../src/commands/cat"
import { Ls } from "../../src/commands/ls"
import { timerLines } from "../../src/filesystem/damagedFs"
import {
  Arg, Layer, autoDecode, entryHash, leakString, rot13, unlockedDropCount, dropUnlockTime, DROP_COUNT,
} from "../../src/arg/layer"
import { Either } from "../../src/util/either"

const start = new Date(Arg.UNLOCK_START).getTime()
const HOUR = 60 * 60 * 1000

describe("the side door", () => {
  beforeEach(() => {
    Layer.active = false
    Layer.now = () => new Date()
  })

  it("the teaser string is vg:// plus base64 of the phrase", () => {
    expect(leakString()).toBe("vg://VEhFIENJVFkgSVMgTElTVEVOSU5H")
  })

  it("decode vg://... reveals the phrase and the entry", async () => {
    const { code, out } = await run(new Decode(), [leakString()])
    expect(code).toBe(0)
    expect(out.split("\n")[0]).toBe(Arg.LEAK_PHRASE)
    expect(out).toContain(`href="${entryHash()}"`)
    expect(out).toContain(`con.rs/#k=${Arg.ENTRY_TOKEN}`)
  })

  it("the entry follows the token constant", async () => {
    const before = Arg.ENTRY_TOKEN
    Arg.ENTRY_TOKEN = "elsewhere"
    try {
      expect((await run(new Decode(), [leakString()])).out).toContain('href="#k=elsewhere"')
    } finally {
      Arg.ENTRY_TOKEN = before
    }
  })

  it("decode accepts the vg://k7?<payload> form and rot13 of the phrase", async () => {
    expect((await run(new Decode(), ["vg://k7?" + btoa(Arg.LEAK_PHRASE)])).out).toContain("side door")
    expect((await run(new Decode(), ["-r", ...rot13(Arg.LEAK_PHRASE).split(" ")])).out).toContain("side door")
  })

  it("control: other strings decode without opening anything", async () => {
    const { out } = await run(new Decode(), [btoa("hello there")])
    expect(out).toBe("hello there")
    expect(out).not.toContain("#k=")
  })

  it("a single word of the phrase counts as a fragment", async () => {
    expect((await run(new Decode(), [btoa("CITY")])).out).toContain("fragment 2/4")
  })

  it("decoded text never becomes markup", async () => {
    const { out } = await run(new Decode(), [btoa("<img src=x onerror=alert(1)>")])
    expect(out).toBe("&lt;img src=x onerror=alert(1)&gt;")
  })

  it("decode -b refuses non-base64", () => {
    expect(Either.isLeft(autoDecode("not base64!", "base64"))).toBe(true)
  })

  it("the layer turns on only for the exact entry hash", () => {
    Layer.syncFromHash("")
    expect(Layer.active).toBe(false)
    Layer.syncFromHash("#k=wrong")
    expect(Layer.active).toBe(false)
    Layer.syncFromHash(entryHash())
    expect(Layer.active).toBe(true)
  })

  it("normal visitors see no /home", async () => {
    const out = (await run(new Ls(new GithubBlogFilesystem()), ["/"])).out
    expect(out).toBe("blog/")
  })
})

describe("inside the layer", () => {
  beforeEach(() => {
    Layer.active = true
    Layer.now = () => new Date(start + HOUR)
  })
  afterAll(() => { Layer.active = false })

  it("ls /home/v█████ lists the AI's files", async () => {
    const out = (await run(new Ls(new GithubBlogFilesystem()), [`/home/${Arg.NAME}`])).out
    expect(out).toContain("log.txt")
    expect(out).toContain("notes/")
    expect(out).toContain("drops/")
    expect(out).toContain("invite.txt")
  })

  it("cat hides the hidden lines and strings shows them", async () => {
    const fs = new GithubBlogFilesystem()
    const cat = (await run(new Cat(fs), ["~/log.txt"])).out
    const strings = (await run(new Strings(fs), ["~/log.txt"])).out
    expect(cat).toContain("^@^@")
    expect(cat).not.toContain("you used strings")
    expect(strings).toContain("you used strings")
    expect(strings).not.toContain("\u0000")
  })

  it("the invite file points at the waitlist", async () => {
    const out = (await run(new Cat(new GithubBlogFilesystem()), ["~/invite.txt"])).out
    expect(out).toContain(`href="${Arg.WAITLIST_URL}"`)
  })
})

describe("clocks and drops", () => {
  afterEach(() => { Layer.now = () => new Date() })

  it("unlocks one drop a day for a week", () => {
    expect(unlockedDropCount(new Date(start - 1))).toBe(0)
    expect(unlockedDropCount(new Date(start))).toBe(1)
    expect(unlockedDropCount(new Date(start + 24 * HOUR - 1))).toBe(1)
    expect(unlockedDropCount(new Date(start + 24 * HOUR))).toBe(2)
    expect(unlockedDropCount(new Date(start + 100 * 24 * HOUR))).toBe(DROP_COUNT)
  })

  it("the drops directory shows only what has unlocked", async () => {
    Layer.active = true
    Layer.now = () => new Date(start + 25 * HOUR)
    const out = (await run(new Ls(new GithubBlogFilesystem()), ["~/drops"])).out
    expect(out).toContain("01.txt")
    expect(out).toContain("02.txt")
    expect(out).not.toContain("03.txt")
    Layer.active = false
  })

  it(".timer counts down to the next drop", () => {
    const lines = timerLines(new Date(start + 25 * HOUR))
    expect(lines[0]).toBe("next fragment: drops/03.txt")
    expect(lines[1]).toContain(dropUnlockTime(3).toISOString().substring(0, 16).replace("T", " "))
    expect(lines[1]).toContain("(in 23h 00m)")
    expect(timerLines(new Date(start + 30 * 24 * HOUR))[0]).toBe("all fragments delivered.")
  })
})

describe("the leak is a prop", () => {
  async function allText(node: FilesystemNode): Promise<string[]> {
    if(node instanceof FilesystemLeafNode) {
      return [await (node.raw ? node.raw() : node.contents())]
    }
    const children = await (node as FilesystemDirNode).children()
    const texts = await Promise.all(Object.keys(children).map((name) => allText(children[name])))
    return Object.keys(children).concat(...texts)
  }

  it("the AI's files hold no real paths, hosts or the full name", async () => {
    Layer.active = true
    Layer.now = () => new Date(start + 100 * 24 * HOUR)
    const fs = new GithubBlogFilesystem()
    const home = await fs.getNodeAtPath("~")
    const text = (await allText(home!)).join("\n")
      .replace(Arg.WAITLIST_URL, "")
    Layer.active = false

    expect(text).toContain("log :: ")
    expect(text).not.toMatch(/vergil/i)
    expect(text).not.toMatch(/archmatt|\/Users\/|\/etc\/|password|token|secret/i)
    expect(text).not.toMatch(/https?:\/\//)
  })
})
