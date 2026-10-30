import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

export class Clear extends Command {
  command: string = "clear"
  helpText: string = "clear the terminal screen"
  async run(_: Stream<number>, stdout: Stream<number>, __?: string[]): Promise<number> {
    // The screen's buffer resets on StartOfText (buffer.ts, cursoredBufferElementManager.ts).
    stdout.write(Ascii.Codes.StartOfText)
    return 0
  }
}
