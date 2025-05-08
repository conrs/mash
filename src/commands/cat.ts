import { Command } from "./baseCommand";
import { Filesystem, FilesystemDirNode, FilesystemLeafNode } from "../filesystem/core";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

export class Cat extends Command {
  command: string = "cat"
  helpText: string = "echo contents of file"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args && args[0] ? args[0] : ""
    let returnCode = 0;

    let node = await this.filesystem.getNodeAtPath(path)

    if(typeof node == "undefined") {
      returnCode = 1;
      await stdout.write(Ascii.stringToCharacterCodes(`Error: Path '${path}' doesn't exist`));
    } else if (node instanceof FilesystemLeafNode) {
      let contents = await node.contents()
      stdout.write(Ascii.stringToCharacterCodes(contents));
    } else if(node instanceof FilesystemDirNode) {
      returnCode = 1;
      await stdout.write(Ascii.stringToCharacterCodes(`Error: Path '${path}' is not a file`))
    }

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}