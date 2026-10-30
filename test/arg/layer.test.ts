import { run } from "../helpers"
import { GithubBlogFilesystem } from "../../src/filesystem/githubBlogFs"
import { FilesystemDirNode, FilesystemLeafNode, FilesystemNode } from "../../src/filesystem/core"
import { Decode } from "../../src/commands/decode"
import { Strings } from "../../src/commands/strings"
import { Cat } from "../../src/commands/cat"
import { Ls } from "../../src/commands/ls"
import { timerLines } from "../../src/filesystem/damagedFs"
import { Arg, Layer, autoDecode, leakString, rot13, isPhraseShaped } from "../../src/arg/layer"
import { Either } from "../../src/util/either"
import { FIXTURE, FIXTURE_NEXT, FIXTURE_TOKEN, enter, knocks, leave, restoreRemote, useFixtureRemote } from "./fixture"

const HOUR = 60 * 60 * 1000

beforeEach(() => { leave(); useFixtureRemote() })
afterAll(() => { leave(); restoreRemote() })

describe("decode and the teaser", () => {
  it("the teaser string is vg:// plus base64 of the public phrase", () => {
    expect(leakString()).toBe("vg://" + btoa(Arg.LEAK_PHRASE))
  })

  it("the teaser leads to whatever the Worker says next, not to a door", async () => {
    const { code, out } = await run(new Decode(), [leakString()])
    expect(code).toBe(0)
    expect(out.split("\n")[0]).toBe(Arg.LEAK_PHRASE)
    expect(out).toContain("handshake accepted")
    expect(out).toContain(FIXTURE_NEXT)
    expect(out).not.toContain("#k=")
  })

  it("the phrase the Worker accepts opens the side door it names", async () => {
    const { out } = await run(new Decode(), [btoa("FIXTURE ANSWER")])
    expect(out).toContain(`href="#k=${FIXTURE_TOKEN}"`)
    expect(out).toContain(`con.rs/#k=${FIXTURE_TOKEN}`)
  })

  it("inside, the door line says so instead of linking", async () => {
    enter()
    const { out } = await run(new Decode(), [btoa("FIXTURE ANSWER")])
    expect(out).toContain("already inside")
    expect(out).not.toContain("href=")
  })

  it("Worker lines never become markup", async () => {
    Layer.remote = { ...Layer.remote, knock: async () => ({ ok: true, lines: ["<img src=x>"], door: "<b>" }) }
    const { out } = await run(new Decode(), [btoa("ANY WORDS")])
    expect(out).toContain("&lt;img src=x&gt;")
    expect(out).not.toContain("<img")
    expect(out).not.toContain("<b>")
  })

  it("an unreachable Worker: the teaser says the line went quiet, other phrases say nothing more", async () => {
    Layer.remote = { ...Layer.remote, knock: async () => { throw new Error("offline") } }
    expect((await run(new Decode(), [leakString()])).out).toContain("the line went quiet")
    expect((await run(new Decode(), [btoa("SOME OTHER WORDS")])).out).toBe("SOME OTHER WORDS")
  })

  it("decode accepts the vg://k7?<payload> form and rot13 of the phrase", async () => {
    expect((await run(new Decode(), ["vg://k7?" + btoa(Arg.LEAK_PHRASE)])).out).toContain(FIXTURE_NEXT)
    expect((await run(new Decode(), ["-r", ...rot13(Arg.LEAK_PHRASE).split(" ")])).out).toContain(FIXTURE_NEXT)
  })

  it("decode forgives lookalikes in a hand-typed teaser string", async () => {
    const opens = async (input: string) => {
      const { code, out } = await run(new Decode(), [input])
      expect(code).toBe(0)
      expect(out.split("\n")[0]).toBe(Arg.LEAK_PHRASE)
      expect(out).toContain("handshake accepted")
    }
    expect(leakString()).toContain("TElT")
    await opens(leakString().replace("TElT", "TE1T")) // 1 for l
    await opens(leakString().replace("TElT", "TEIT")) // I for l
    await opens(leakString().replace("VEVOSU5H", "VEV0SU5H")) // 0 for O
    await opens(`"${leakString()}=" `) // quotes, padding, whitespace
    await opens(encodeURIComponent(leakString())) // pasted URL-encoded
  })

  it("control: a non-leak phrase decodes normally and opens nothing", async () => {
    const { out } = await run(new Decode(), ["vg://" + btoa("THE CITY IS SLEEPING")])
    expect(out).toBe("THE CITY IS SLEEPING")
  })

  it("only phrase-shaped text is sent to the Worker", async () => {
    await run(new Decode(), [btoa("hello there")])
    await run(new Decode(), [btoa("my email is a@b.c")])
    await run(new Decode(), [btoa("CITY")])
    expect(knocks).toEqual(["hello there"])
    expect(isPhraseShaped("x".repeat(200) + " y")).toBe(false)
  })

  it("a single word of the teaser phrase counts as a fragment", async () => {
    expect((await run(new Decode(), [btoa("CITY")])).out).toContain("fragment 2/4")
  })

  it("decoded text never becomes markup", async () => {
    const { out } = await run(new Decode(), [btoa("<img src=x onerror=alert(1)>")])
    expect(out).toBe("&lt;img src=x onerror=alert(1)&gt;")
  })

  it("decode -b refuses non-base64", () => {
    expect(Either.isLeft(autoDecode("not base64!", "base64"))).toBe(true)
  })
})

describe("the side door", () => {
  it("opens only when the Worker hands back content", async () => {
    await Layer.openFromHash("")
    expect(Layer.active).toBe(false)
    await Layer.openFromHash("#k=wrong")
    expect(Layer.active).toBe(false)
    await Layer.openFromHash("#k=" + FIXTURE_TOKEN)
    expect(Layer.active).toBe(true)
    expect(Layer.content).toEqual(FIXTURE)
  })

  it("a closed door can answer with a note; an unreachable one says so", async () => {
    await Layer.openFromHash("#k=noted")
    expect(Layer.active).toBe(false)
    expect(Layer.note).toBe("fixture note")
    Layer.remote = { ...Layer.remote, door: async () => { throw new Error("offline") } }
    await Layer.openFromHash("#k=" + FIXTURE_TOKEN)
    expect(Layer.active).toBe(false)
    expect(Layer.note).toContain("no answer")
  })

  it("control: odd hashes never reach the Worker", async () => {
    let asked = 0
    Layer.remote = { ...Layer.remote, door: async () => { asked++; return { ok: false } } }
    await Layer.openFromHash("#k=../../x")
    await Layer.openFromHash("#about")
    expect(asked).toBe(0)
  })

  it("normal visitors see no /home", async () => {
    const out = (await run(new Ls(new GithubBlogFilesystem()), ["/"])).out
    expect(out).toBe("blog/")
  })
})

describe("inside the layer", () => {
  beforeEach(() => enter())

  it("ls ~ lists the fetched tree, the drops and the timer", async () => {
    const fs = new GithubBlogFilesystem()
    const out = (await run(new Ls(fs), ["-a", `/home/${Arg.NAME}`])).out
    expect(out).toContain("log.txt")
    expect(out).toContain("notes/")
    expect(out).toContain("drops/")
    expect(out).toContain(".timer")
    const drops = (await run(new Ls(fs), ["~/drops"])).out
    expect(drops).toContain("01.txt")
    expect(drops).toContain("02.txt")
    expect(drops).not.toContain("03.txt")
    expect((await run(new Cat(fs), ["~/notes/a.txt"])).out).toBe("note a")
  })

  it("cat hides the hidden lines and strings shows them", async () => {
    const fs = new GithubBlogFilesystem()
    const cat = (await run(new Cat(fs), ["~/log.txt"])).out
    const strings = (await run(new Strings(fs), ["~/log.txt"])).out
    expect(cat).toContain("^@^@")
    expect(cat).not.toContain("hidden fixture line")
    expect(strings).toContain("hidden fixture line")
    expect(strings).not.toContain("\u0000")
  })
})

describe("the timer", () => {
  const next = new Date(FIXTURE.timer.nextAt!).getTime()

  it("counts down to the next drop", () => {
    const lines = timerLines(FIXTURE.timer, new Date(next - 23 * HOUR))
    expect(lines[0]).toBe("next fragment: drops/03.txt")
    expect(lines[1]).toContain("2026-01-03 16:00 UTC")
    expect(lines[1]).toContain("(in 23h 00m)")
    expect(lines[2]).toBe("delivered:     2/7")
  })

  it("past the unlock it asks for a reconnect; after the last it is done", () => {
    expect(timerLines(FIXTURE.timer, new Date(next + 1))[1]).toContain("reconnect")
    expect(timerLines({ total: 7, delivered: 7, nextAt: null })[0]).toBe("all fragments delivered.")
  })
})

describe("the public repo holds no story", () => {
  async function allText(node: FilesystemNode): Promise<string[]> {
    if(node instanceof FilesystemLeafNode) {
      return [await (node.raw ? node.raw() : node.contents())]
    }
    const children = await (node as FilesystemDirNode).children()
    const texts = await Promise.all(Object.keys(children).map((name) => allText(children[name])))
    return Object.keys(children).concat(...texts)
  }

  it("with the door shut there is no home at all", async () => {
    expect(await new GithubBlogFilesystem().getNodeAtPath(`/home/${Arg.NAME}`)).toBeUndefined()
  })

  it("everything inside comes from the door's content", async () => {
    enter()
    const text = (await allText((await new GithubBlogFilesystem().getNodeAtPath("~"))!)).join("\n")
    expect(text).toContain("log :: fixture")
    expect(text).not.toMatch(/vergil/i)
  })
})
