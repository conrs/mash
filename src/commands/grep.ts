import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Stream } from "../util/stream";
import { Either } from "../util/either";
import { readAll, readFile, writeText } from "./io";

export class Grep extends Command {
  command: string = "grep"
  helpText: string = "print lines that match a pattern (-i ignore case, -n line numbers)"
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const flags = (args || []).filter((x) => x.startsWith("-") && x.length > 1).join("")
    const [pattern, path] = (args || []).filter((x) => !(x.startsWith("-") && x.length > 1))

    if(pattern === undefined) {
      writeText(stdout, "usage: grep [-i] [-n] PATTERN [FILE]")
      return 2
    }

    let text: string
    if(path) {
      const textEither = await readFile(this.filesystem, path)
      if(Either.isLeft(textEither)) {
        writeText(stdout, `grep: ${Either.getValue(textEither).message}`)
        return 2
      }
      text = Either.getValue(textEither)
    } else {
      text = await readAll(stdin)
    }

    const ignoreCase = flags.includes("i")
    const needle = ignoreCase ? pattern.toLowerCase() : pattern
    const matches = text.split("\n")
      .map((line, i) => ({ line, number: i + 1 }))
      .filter(({ line }) => (ignoreCase ? line.toLowerCase() : line).includes(needle))
      .map(({ line, number }) => flags.includes("n") ? `${number}:${line}` : line)

    writeText(stdout, matches.join("\n"))
    return matches.length > 0 ? 0 : 1
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}
