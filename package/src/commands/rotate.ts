import { Command } from ".";
import { Stream } from "../util";
import { util } from "..";

// Problems:
// We should emit characters right away, but how do you prevent them from going to stdout?
// We can't suppress by default, but we could build in signalling for "buffering" versus "emitting"
// output in mash.
// We may also want to pre-empt things.
export class Rotate extends Command {
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    let amount = 1
    if(args && args[0]) {
      let passedAmount = parseInt(args[0], 10)

      if(passedAmount != NaN && Number.isInteger(passedAmount) && amount > 0 && amount < 26) {
        amount = passedAmount
      } else {
        stdout.write(util.Ascii.stringToCharacterCodes(`Invalid rotation value: '${passedAmount}' - must be positive integer no larger than 25`))
      }
    }

    await stdin.consume((characters) => {
      try {
        characters.forEach((character) => {
          if(character == util.Ascii.Codes.EndOfTransmission) {
            throw new HitEOT()
          }

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