import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

// Problems:
// We should emit characters right away, but how do you prevent them from going to stdout?
// We can't suppress by default, but we could build in signalling for "buffering" versus "emitting"
// output in mash.
// We may also want to pre-empt things.
export class Rotate extends Command {
  command: string = "rotate [num_characters]"
  helpText: string = "rotates all entered text by number of characters entered"
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let amount = 1
    if(args && args[0]) {
      let passedAmount = parseInt(args[0], 10)

      if(!Number.isNaN(passedAmount) && Number.isInteger(passedAmount) && amount > 0 && amount < 26) {
        amount = passedAmount
      } else {
        stdout.write(Ascii.stringToCharacterCodes(`Invalid rotation value: '${args[0]}' - must be positive integer no larger than 25`))
        return 1
      }
    }

    await stdin.consume((characters: number[]) => {
      try {
        characters.forEach((character: number) => {
          if(character == Ascii.Codes.EndOfTransmission) {
            throw new HitEOT()
          }

          amount = amount % 26

          // we only rotate a-z A-Z
          if(character >= 65 && character <= 90) {
            character += amount
            if(character > 90) {
              character = 65 + (character - 91)
            }
          } else if(character >= 97 && character <= 122) {
            character += amount
            if(character > 122) {
              character = 97 + (character - 123)
            }
          }

          stdout.write(character)
        })
      } catch(e) {
        if(e instanceof HitEOT) {
          return false
        }
      }
    })

    return 0
  }
}

class HitEOT {}