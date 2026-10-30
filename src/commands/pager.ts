import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Stream } from "../util/stream";
import { Either } from "../util/either";
import { readAll, readFile, writeText } from "./io";

/** less and more: the page already scrolls, so this shows the whole file (or stdin). */
export class Pager extends Command {
  helpText: string = "view a file (your scrollbar is the pager)"
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const path = args && args[0]

    if(!path) {
      writeText(stdout, await readAll(stdin))
      return 0
    }

    const textEither = await readFile(this.filesystem, path)
    writeText(stdout, Either.isLeft(textEither) ? `${this.command}: ${Either.getValue(textEither).message}` : Either.getValue(textEither))
    return Either.isLeft(textEither) ? 1 : 0
  }

  constructor(
    public command: string,
    private filesystem: Filesystem) {
      super()
  }
}
