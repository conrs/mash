import { Command } from "../src/commands/baseCommand"
import { Ascii } from "../src/util/ascii"
import { Either } from "../src/util/either"
import { Stream } from "../src/util/stream"

/** Runs a command to completion and returns its exit code and everything it wrote. */
export async function run(command: Command, args: string[] = [], stdinText?: string): Promise<{ code: number, out: string }> {
  const stdin = new Stream<number>()
  const stdout = new Stream<number>()

  if(stdinText !== undefined) {
    stdin.write(Ascii.stringToCharacterCodes(stdinText).concat([Ascii.Codes.EndOfTransmission]))
  }

  const code = await command.run(stdin, stdout, args)
  const outEither = stdout.read()
  if(Either.isLeft(outEither)) {
    throw Either.getValue(outEither)
  }
  return { code, out: Ascii.characterCodesToString(Either.getValue(outEither)) }
}
