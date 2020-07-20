/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import { Stream }from "../util/stream";
import { Ascii } from "../util/ascii";
import { CursorPositionHandler } from "../util/cursorPositionHandler";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";

export class Buffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"

  cursorPosition: CursorPositionHandler
  buffer: number[]

  constructor(
    stdin: Stream<number>,
    stdout: Stream<number>,
    width?: number, 
  ) {
    super(stdin, stdout)
    this.cursorPosition = new CursorPositionHandler(width)
    this.buffer = []
  }

  static async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    let width = args[0] ? parseInt(args[0], 10) : undefined

    return new Buffer(stdin, stdout, width).run(args)
  }

  async run(args: string[] = []): Promise<number> {
    if(args.length > 1) {
      Stream.writeString(this.stdout, `Too many arguments passed to ${this.name}: ${args}`)
      return 1;
    }

    return new Promise((resolve, reject) => {
      consumeRepeatedly(this.stdin, (characterCode) => {
        this.bufferCharacterCode(characterCode, true)
        return false;
      }).then(() => resolve(0))
    })
  }

  private bufferCharacterCode(characterCode: number, moveCursor: boolean = true) {
    if(this.cursorPosition.handleCharacterCode(characterCode, moveCursor)) {
      if(Ascii.isPrintableCharacterCode(characterCode)) {
        // Handle it in our buffer. 
        // console.log(characterCode, Ascii.getPrintableCharacter(characterCode))
        if(!moveCursor || this.cursorPosition.isAtEnd()) {
          this.buffer.push(characterCode)
          this.stdout.write(characterCode)
        } else {
          this.stdout.write(Ascii.Codes.ClearScreen)

          let targetCursorX = this.cursorPosition.getX()
          let targetCursorY = this.cursorPosition.getY()

          let oldBuffer: number[] = this.buffer
          let bufferIndex = 0;

          this.cursorPosition = new CursorPositionHandler(this.cursorPosition.maxWidth)

          this.buffer = []
          while(
            this.cursorPosition.getX() != targetCursorX || 
            this.cursorPosition.getY() != targetCursorY
            ) {
              let characterCode = oldBuffer[bufferIndex]
              this.bufferCharacterCode(characterCode)
              bufferIndex++;
            }

          // Now `this.cursorPosition` is "caught up" to the place the cursor was. So, we add our new character there. 
          this.bufferCharacterCode(characterCode, false);

          // And now, run through the rest of the buffer (but do not move cursor)
          oldBuffer.slice(bufferIndex).forEach((characterCode) => this.bufferCharacterCode(characterCode, false))
        }
      } else {
        this.stdout.write(characterCode)
      }
    }
  }

  //run()
  //   // Set up the cursor blink and position updater
  //   setInterval(() => {
  //     // The cursor is visible if stdin is being waited on. 
  //     if(this.stdin.hasListeners()) {
  //       this.cursorVisible = !this.cursorVisible 
  //     } else {
  //       this.cursorVisible = false;
  //     }
  //     cursorUpdater(this.cursorPosition.getX(), this.cursorPosition.getY(), this.cursorVisible)
  //   }, 600)

  //   // Read stdout to update buffer and position
  //   let stdoutListenHelper = (characterCode: number) => {
  //     if(characterCode == Ascii.Codes.Bell || !this.cursorPosition.handleCharacterCode(characterCode)) {
  //       console.log("DING dont do that")
  //     }
  //     if(Ascii.isPrintableCharacterCode(characterCode)) {
  //       let character = Ascii.getPrintableCharacter(characterCode)
        
  //       this.buffer += character;

  //       outputBufferUpdater(this.buffer)
  //     }
  //     // TODO: handle signals

  //     this.stdout.read().then(stdoutListenHelper)
  //   }

  //   this.stdout.read().then(stdoutListenHelper)

  //   let characterStreamHelper = (character: number) => {
  //     this.stdin.write(character)

  //     this.asciiCharacterStream.read().then(characterStreamHelper)
  //   }
  //   this.asciiCharacterStream.read().then(characterStreamHelper)
  // }

  // public resize(newWidth: number) {
  //   this.cursorPosition.resize(newWidth, this.buffer)
  // }
}