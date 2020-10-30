import { BaseCommand } from ".";
import { Filesystem, FilesystemRootNode, FilesystemLeafNode } from "../filesystem/core";
import { Stream } from "../util";
import { util } from "..";

export class Cat extends BaseCommand {
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args[0] ? args[0] : ""
    let returnCode = 0;

    let node = await this.filesystem.getNodeAtPath(path)

    if(typeof node == "undefined") {
      returnCode = 1;
      await stdout.write(util.Ascii.stringToCharacterCodes(`Error: Path '${path}' doesn't exist`));
    } else if (node instanceof FilesystemLeafNode) {
      let contents = await node.contents()
      stdout.write(util.Ascii.stringToCharacterCodes(contents));
    } else if(node instanceof FilesystemRootNode) {
      returnCode = 1;
      await stdout.write(util.Ascii.stringToCharacterCodes(`Error: Path '${path}' is not a file`))
    }

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}