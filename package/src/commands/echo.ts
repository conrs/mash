import { BaseCommand } from ".";
import { Filesystem, FilesystemRootNode, FilesystemLeafNode } from "../filesystem/core";
import { Stream } from "../util";
import { util } from "..";

export class Echo extends BaseCommand {
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    stdout.write(util.Ascii.stringToCharacterCodes(args ? args.join(" "): ""))
    return 0
  }
}