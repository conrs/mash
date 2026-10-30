import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Stream } from "../util/stream";
import { Either } from "../util/either";
import { readFile, writeText } from "./io";

export class Strings extends Command {
  command: string = "strings"
  helpText: string = "print the printable strings in a file, even the ones cat skips"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const path = args && args[0]

    if(!path) {
      writeText(stdout, "usage: strings FILE")
      return 1
    }

    const textEither = await readFile(this.filesystem, path, true)
    if(Either.isLeft(textEither)) {
      writeText(stdout, `strings: ${Either.getValue(textEither).message}`)
      return 1
    }

    // Like binutils strings: runs of at least 4 printable characters.
    const runs = Either.getValue(textEither).match(/[\x20-\x7e█░-▓]{4,}/g) || []
    writeText(stdout, runs.join("\n"))
    return 0
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}
