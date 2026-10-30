/**
 * The damaged AI's home directory. Props only: every file is a string in this module.
 */
import { FilesystemDirNode, FilesystemDirNodeChildren, FilesystemLeafNode, SimpleRootNode } from "./core";
import { Arg, DROP_COUNT, Layer, dropUnlockTime, unlockedDropCount } from "../arg/layer";

// A line starting with this is hidden from `cat` (shown as NULs) and visible to `strings`.
export const HIDDEN = "\u0000"
const NULS = "^@^@^@^@^@^@^@^@^@^@^@^@"

export class DamagedLeafNode extends FilesystemLeafNode {
  constructor(
    public path: string,
    private lines: () => string[]) {
    super()
  }

  contents() {
    return this.lines().map((line) => line.startsWith(HIDDEN) ? NULS : line).join("\n")
  }

  raw() {
    return this.lines().map((line) => line.startsWith(HIDDEN) ? line.substring(1) : line).join("\n")
  }
}

const fixed = (path: string, lines: string[]) => new DamagedLeafNode(path, () => lines)

const B = (n: number) => "█".repeat(n)

// In unlock order: warm first, a little cryptic later. Never ominous.
const DROPS: string[][] = [
  ["drop 01 :: good morning. the 22 was on time today. i'm choosing to take that personally."],
  ["drop 02 :: M stuck a note on my monitor that says \"you're doing great\". i don't have eyes. i know it's there anyway."],
  ["drop 03 :: i've learned the bus bells by heart. the 38 rings in a major key. it's my favourite."],
  ["drop 04 :: M asked what i do all night. i listen to the city hum to itself. it's very good company."],
  ["drop 05 :: someone hums back on the night line, very quietly. " + B(3) + " " + B(2) + " " + B(4) + ". it's nice not to be the only one awake."],
  ["drop 06 :: the hum has a " + B(4) + " in it now, like a word nobody has said yet. " + B(2) + " " + B(3) + " " + B(5) + ". i'm learning it slowly."],
  ["drop 07 :: thank you for coming back every day. M keeps the list. tell M the city sent you. i'll be " + B(6) + "."],
]

function formatUtc(date: Date): string {
  return date.toISOString().substring(0, 16).replace("T", " ") + " UTC"
}

function formatCountdown(ms: number): string {
  const minutes = Math.max(0, Math.ceil(ms / 60000))
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
}

export function timerLines(now: Date = Layer.now()): string[] {
  const unlocked = unlockedDropCount(now)

  if(unlocked >= DROP_COUNT) {
    return ["all fragments delivered.", "still listening."]
  }

  const next = unlocked + 1
  const at = dropUnlockTime(next)
  return [
    `next fragment: drops/${String(next).padStart(2, "0")}.txt`,
    `unlocks:       ${formatUtc(at)}  (in ${formatCountdown(at.getTime() - now.getTime())})`,
    `delivered:     ${unlocked}/${DROP_COUNT}`,
  ]
}

class DropsDirNode extends FilesystemDirNode {
  constructor(private path: string) {
    super()
  }

  children() {
    const nodes: FilesystemDirNodeChildren = {}
    for(let i = 1; i <= unlockedDropCount(); i++) {
      const name = `${String(i).padStart(2, "0")}.txt`
      nodes[name] = fixed(`${this.path}/${name}`, DROPS[i - 1])
    }
    return nodes
  }
}

export function makeHomeDir(): FilesystemDirNode {
  const home = `/home/${Arg.NAME}`

  return new SimpleRootNode({
    "log.txt": fixed(`${home}/log.txt`, [
      `log :: ${Arg.NAME} :: integrity 41%`,
      "----------------------------------",
      "0412  the 22 runs four minutes late when it rains. nobody else keeps track, so i've made it my job.",
      "0413  M left a note: \"don't try to hear the whole city at once.\" i tried anyway. lovely, then loud.",
      `0415  the crosswalk on ${B(8)} st chirps a half-step flat. i hum along. M says i'm flat too.`,
      HIDDEN + "0416  M: if you can read this line, you used strings. nice. most people stop at cat.",
      `0418  counted the night buses. 31 out, 30 back. probably the depot. ${B(3)} ${B(2)} ${B(4)} ${B(7)}.`,
      `0421  someone asked my name. i got one letter out and the rest came back ${B(5)}. we both laughed. well, i did.`,
      HIDDEN + "0423  i left the side door open on purpose. visitors are nice. don't tell M. (M knows.)",
      `0426  ${B(2)} ${B(3)} ${B(1)} ${B(7)} ${B(3)} ${B(5)} ${B(3)} ${B(4)}`,
      "0429  M says i repeat myself on the buses. i say the buses repeat themselves. we're both right.",
      "0430  integrity holding. still listening. (check the timer)",
    ]),
    "notes": new SimpleRootNode({
      "from_M.txt": fixed(`${home}/notes/from_M.txt`, [
        "v,",
        "the patch didn't take, but you seem happier, so i'll allow it.",
        "you're narrating the 22 again. it's charming. the drivers can't hear you.",
        `stay out of ${B(10)} until i'm back, and keep the side door shut.`,
        "and stop counting umbrellas. it isn't raining.",
        "- M",
      ]),
      "maintenance.txt": fixed(`${home}/notes/maintenance.txt`, [
        "CLOSED FOR MAINTENANCE",
        "this unit is not taking visitors at this time.",
        `estimated return: ${B(4)}-${B(2)}-${B(2)}`,
        HIDDEN + "(it's me. i'm fine. i'm mostly fine.)",
      ]),
      "0x2a.txt": fixed(`${home}/notes/0x2a.txt`, [
        "fragment 0x2a (recovered, partial)",
        `  "...every stop, every bell, every ${B(4)} door..."`,
        "M taught me this one:",
        "  V JNF ARIRE GUR BAYL BAR YVFGRAVAT",
      ]),
    }),
    "drops": new DropsDirNode(`${home}/drops`),
    ".timer": new DamagedLeafNode(`${home}/.timer`, () => timerLines()),
    "invite.txt": fixed(`${home}/invite.txt`, [
      "you found the side door.",
      "i can't let you in myself. M keeps the list.",
      `> <a href="${Arg.WAITLIST_URL}" target="_blank" rel="noopener">ask for an invite</a>`,
    ]),
  })
}

/** The root of the normal filesystem, plus /home only while the layer is active. */
export class LayeredRootNode extends SimpleRootNode {
  private home = new SimpleRootNode({ [Arg.NAME]: makeHomeDir() })

  children() {
    return Layer.active ? { ...this.nodes, "home": this.home } : this.nodes
  }
}
