import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Ascii } from "../util/ascii";
import { Stream } from "../util/stream";

export class Cd extends Command {
  command: string = "cd"
  helpText: string = "change the current working directory"
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args && args[0] ? args[0] : ""

    let returnCode = (await this.filesystem.cd(path)) ? 0 : 1;

    if(returnCode != 0) {
      stdout.write(Ascii.stringToCharacterCodes(`Path '${path}' not found.`))
    } 

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}