import { BaseCommand } from ".";
import { Filesystem, FilesystemRootNode, FilesystemLeafNode } from "../filesystem/core";
import { Stream } from "../util";
import { util } from "..";

export class Ls extends BaseCommand {
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args[0] ? args[0] : "."
    let returnCode = 0;

    let node = await this.filesystem.getNodeAtPath(path)

    if(typeof node == "undefined") {
      returnCode = 1
      await stdout.write(util.Ascii.stringToCharacterCodes(`Error: Path '${path}' doesn't exist`));
    } else if (node instanceof FilesystemLeafNode) {
      await stdout.write(util.Ascii.stringToCharacterCodes(path));
    } else if(node instanceof FilesystemRootNode) {
      let children = await node.children()

      let files = Object.keys(children).map((key) => {
        if(children[key] instanceof FilesystemRootNode) {
          return key + "/"
        } else {
          return key
        }
      })

      await stdout.write(util.Ascii.stringToCharacterCodes(files.join("\n")))
    }

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}