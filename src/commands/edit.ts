import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

export class Edit extends Command {
  command: string = "edit"
  helpText: string = "allow editing of entire buffer"
  async run(stdin: Stream<number>, stdout: Stream<number>, _?: string[]): Promise<number> {
    await stdin.consume((characters) => {
        for(let i = 0; i < characters.length; i++) {
            const char = characters[i]

            if(char === Ascii.Codes.EndOfTransmission) {
                return false;
            } else {
                stdout.write(char)
            }
        }
    })

    return 1
  }
}