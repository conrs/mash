import { Command } from "./baseCommand";
import { Filesystem, FilesystemDirNode, FilesystemLeafNode } from "../filesystem/core";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

export class Ls extends Command {
  command: string = "ls";
  helpText: string = "list contents of current working directory"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args && args[0] ? args[0] : "."
    let returnCode = 0;

    let node = await this.filesystem.getNodeAtPath(path)

    if(typeof node == "undefined") {
      returnCode = 1
      await stdout.write(Ascii.stringToCharacterCodes(`Error: Path '${path}' doesn't exist`));
    } else if (node instanceof FilesystemLeafNode) {
      await stdout.write(Ascii.stringToCharacterCodes(path));
    } else if(node instanceof FilesystemDirNode) {
      let children = await node.children()

      let files = Object.keys(children).map((key) => {
        if(children[key] instanceof FilesystemDirNode) {
          return key + "/"
        } else {
            let command = `cat ${children[key].path}`
            if(children[key].path.endsWith(".md")) {
                command += " | md2html"
            }
          return `<a href="javascript:void(0);" onclick="inputCommand('${command}');">${key}</a>`
        }
      })

      await stdout.write(Ascii.stringToCharacterCodes(files.join("\n")))
    }

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}