import { DoorContent, KnockAnswer, Layer, workerRemote } from "../../src/arg/layer"

// Stand-in content: the real phrase, token and fragments live only in the Worker.
export const FIXTURE_TOKEN = "fixturedoor"
export const FIXTURE_NEXT = "vg://Zm9vYmFyIGZpeHR1cmU="
export const FIXTURE: DoorContent = {
  banner: ["", "[    0.000000] fixture banner"],
  home: {
    "log.txt": ["log :: fixture", "plain line", "\u0000hidden fixture line"],
    "notes": { "a.txt": ["note a"] },
    "invite.txt": [`> <a href="https://example.com/?from=arg">ask</a>`],
  },
  drops: [["drop 01 :: fixture"], ["drop 02 :: fixture"]],
  timer: { total: 7, delivered: 2, nextAt: "2026-01-03T16:00:00.000Z" },
}

export const knocks: string[] = []
// The via each knock and door call carried, in order.
export const vias: { call: "knock" | "door", via?: string }[] = []

export function useFixtureRemote() {
  knocks.length = 0
  vias.length = 0
  Layer.remote = {
    async knock(text: string, via?: string): Promise<KnockAnswer> {
      knocks.push(text)
      vias.push({ call: "knock", via })
      const p = text.trim().toUpperCase()
      if(p === "THE CITY IS LISTENING") return { ok: true, lines: ["fixture second voice", FIXTURE_NEXT] }
      if(p === "FIXTURE ANSWER") return { ok: true, lines: ["fixture opens"], door: FIXTURE_TOKEN }
      return { ok: false }
    },
    async door(token: string, via?: string) {
      vias.push({ call: "door", via })
      if(token === FIXTURE_TOKEN) return { ok: true, ...FIXTURE }
      if(token === "noted") return { ok: false, note: "fixture note" }
      return { ok: false }
    },
  }
}

export function enter(content: DoorContent = FIXTURE) {
  Layer.content = content
  Layer.note = undefined
}

export function leave() {
  Layer.content = undefined
  Layer.note = undefined
}

export function restoreRemote() {
  Layer.remote = workerRemote
}
