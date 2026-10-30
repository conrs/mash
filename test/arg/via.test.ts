import { run } from "../helpers"
import { Decode } from "../../src/commands/decode"
import { Arg, Layer, viaOf, workerRemote } from "../../src/arg/layer"
import { FIXTURE_TOKEN, leave, restoreRemote, useFixtureRemote, vias } from "./fixture"

// Fixture link codes only: which code belongs to which place lives in the Worker.
const teaser = (via: string) => `vg://${via}?${btoa(Arg.LEAK_PHRASE)}`

function fakeSessionStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.has(k) ? items.get(k)! : null,
    setItem: (k: string, v: string) => { items.set(k, v) },
  }
}

const g = globalThis as any

beforeEach(() => { leave(); useFixtureRemote(); g.sessionStorage = fakeSessionStorage() })
afterAll(() => { leave(); restoreRemote(); delete g.sessionStorage })

describe("tracked teaser links (via)", () => {
  it("decode passes the vg:// prefix to the knock", async () => {
    await run(new Decode(), [teaser("fx01")])
    expect(vias).toEqual([{ call: "knock", via: "fx01" }])
  })

  it("the visit keeps it: a later string with no prefix, and the door after the reload, carry it", async () => {
    await run(new Decode(), [teaser("fx01")])
    await run(new Decode(), [btoa("FIXTURE ANSWER")])
    await Layer.openFromHash("#k=" + FIXTURE_TOKEN)
    expect(Layer.active).toBe(true)
    expect(vias).toEqual([
      { call: "knock", via: "fx01" },
      { call: "knock", via: "fx01" },
      { call: "door", via: "fx01" },
    ])
  })

  it("a newer prefix replaces the old one", async () => {
    await run(new Decode(), [teaser("fx01")])
    await run(new Decode(), [teaser("fx02")])
    expect(vias.map((v) => v.via)).toEqual(["fx01", "fx02"])
  })

  it("control: no prefix and none remembered sends none", async () => {
    await run(new Decode(), ["vg://" + btoa(Arg.LEAK_PHRASE)])
    await Layer.openFromHash("#k=" + FIXTURE_TOKEN)
    expect(vias).toEqual([{ call: "knock", via: undefined }, { call: "door", via: undefined }])
  })

  it("odd prefixes are never sent", () => {
    expect(viaOf(teaser("fx01"))).toBe("fx01")
    expect(viaOf(encodeURIComponent(teaser("fx01")))).toBe("fx01")
    expect(viaOf(`"${teaser("fx01")}"`)).toBe("fx01")
    expect(viaOf("vg://" + btoa(Arg.LEAK_PHRASE))).toBeUndefined()
    expect(viaOf("vg://?abc")).toBeUndefined()
    expect(viaOf("vg://a&b=c?abc")).toBeUndefined()
    expect(viaOf("vg://" + "x".repeat(33) + "?abc")).toBeUndefined()
  })

  it("storage that throws or is missing never breaks decode or the door", async () => {
    g.sessionStorage = { getItem: () => { throw new Error("blocked") }, setItem: () => { throw new Error("blocked") } }
    expect((await run(new Decode(), [teaser("fx01")])).out).toContain("handshake accepted")
    delete g.sessionStorage
    await Layer.openFromHash("#k=" + FIXTURE_TOKEN)
    expect(Layer.active).toBe(true)
    expect(vias).toEqual([{ call: "knock", via: "fx01" }, { call: "door", via: undefined }])
  })

  it("the Worker gets via as its own query parameter, and only when there is one", async () => {
    const urls: string[] = []
    const realFetch = g.fetch
    g.fetch = async (url: string) => { urls.push(url); return { ok: true, json: async () => ({ ok: false }) } }
    try {
      await workerRemote.knock("A B", "fx01")
      await workerRemote.knock("A B")
      await workerRemote.door("tok", "fx01")
      await workerRemote.door("tok")
    } finally {
      g.fetch = realFetch
    }
    expect(urls).toEqual([
      `${Arg.API}/knock?p=A%20B&via=fx01`,
      `${Arg.API}/knock?p=A%20B`,
      `${Arg.API}/door?k=tok&via=fx01`,
      `${Arg.API}/door?k=tok`,
    ])
  })
})
