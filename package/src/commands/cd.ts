import { BaseCommand } from ".";
import { Filesystem } from "../filesystem/core";
import { Stream, Ascii} from "../util";

export class Cd extends BaseCommand {
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let path = args[0] ? args[0] : ""

    let returnCode = (await this.filesystem.cd(path)) ? 0 : 1;

    if(returnCode != 0) {
      stdout.write(Ascii.stringToCharacterCodes(`Path '${path}' not found.`))
    } else {
      stdout.write(Ascii.stringToCharacterCodes("Okey dokey."))
    }

    return returnCode
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}