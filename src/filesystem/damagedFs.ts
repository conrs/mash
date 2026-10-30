/**
 * The damaged AI's home directory. Props only: every file is lines of text from the side door.
 */
import { FilesystemDirNode, FilesystemDirNodeChildren, FilesystemLeafNode, SimpleRootNode } from "./core";
import { Arg, DoorContent, HomeTree, Layer } from "../arg/layer";

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

function formatUtc(date: Date): string {
  return date.toISOString().substring(0, 16).replace("T", " ") + " UTC"
}

function formatCountdown(ms: number): string {
  const minutes = Math.max(0, Math.ceil(ms / 60000))
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
}

export function timerLines(timer: DoorContent["timer"], now: Date = Layer.now()): string[] {
  if(timer.nextAt === null || timer.delivered >= timer.total) {
    return ["all fragments delivered.", "still listening."]
  }

  const at = new Date(timer.nextAt)
  const left = at.getTime() - now.getTime()
  return [
    `next fragment: drops/${String(timer.delivered + 1).padStart(2, "0")}.txt`,
    `unlocks:       ${formatUtc(at)}  (${left > 0 ? `in ${formatCountdown(left)}` : "now: reconnect to receive"})`,
    `delivered:     ${timer.delivered}/${timer.total}`,
  ]
}

function treeNodes(path: string, tree: HomeTree): FilesystemDirNodeChildren {
  const nodes: FilesystemDirNodeChildren = {}
  for(const name of Object.keys(tree)) {
    const entry = tree[name]
    nodes[name] = Array.isArray(entry) ? fixed(`${path}/${name}`, entry) : new SimpleRootNode(treeNodes(`${path}/${name}`, entry))
  }
  return nodes
}

/** The AI's home, built from what the side door handed back. */
export function makeHomeDir(content: DoorContent): FilesystemDirNode {
  const home = `/home/${Arg.NAME}`
  const drops: HomeTree = {}
  content.drops.forEach((lines, i) => { drops[`${String(i + 1).padStart(2, "0")}.txt`] = lines })

  return new SimpleRootNode({
    ...treeNodes(home, { ...content.home, drops }),
    ".timer": new DamagedLeafNode(`${home}/.timer`, () => timerLines(content.timer)),
  })
}

/** The root of the normal filesystem, plus /home only while the layer is open. */
export class LayeredRootNode extends SimpleRootNode {
  private home?: { content: DoorContent, node: FilesystemDirNode }

  children() {
    const content = Layer.content
    if(!content) {
      return this.nodes
    }
    if(this.home?.content !== content) {
      this.home = { content, node: new SimpleRootNode({ [Arg.NAME]: makeHomeDir(content) }) }
    }
    return { ...this.nodes, "home": this.home.node }
  }
}
