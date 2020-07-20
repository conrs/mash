/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import { Stream }from "../util/stream.js";
import { Ascii } from "../util/ascii.js";
import { CursorPositionHandler } from "../util/cursorPositionHandler.js";
import { BaseCommand } from "./baseCommand.js";
import { consumeRepeatedly } from "../util/consumeRepeatedly.js";

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

  static async run(stdin: Stream<number>, stdout: Stream<number>, args: string[]): Promise<number> {
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
        if(this.cursorPosition.handleCharacterCode(characterCode)) {
          this.stdout.write(characterCode)
        }

        if(Ascii.isPrintableCharacterCode(characterCode)) {
          this.bufferCharacterCode(characterCode)
        }
        
        return false;
      }).then(() => resolve(0))
    })
  }

  private bufferCharacterCode(characterCode: number, moveCursor: boolean = true) {
    if(!moveCursor || this.cursorPosition.isAtEnd()) {
      this.buffer.push(characterCode)
    } else {
      // First, write a "clear screen" to stdout to signal that any buffers should be cleared. 
      this.stdout.write(Ascii.Codes.ClearScreen)

      // Now, re-emit our buffer, up until the place a character was entered. Then emit it, then 
      // restore the rest of the buffer.

      let targetCursorX = this.cursorPosition.getX()
      let targetCursorY = this.cursorPosition.getY()

      let oldBuffer: number[] = []
      let bufferIndex = 0;

      this.cursorPosition = new CursorPositionHandler(this.cursorPosition.maxWidth)
      this.buffer = []
      while(
        this.cursorPosition.getX() != targetCursorX && 
        this.cursorPosition.getY() != targetCursorY
        ) {
          let characterCode = oldBuffer[bufferIndex]
          this.cursorPosition.handleCharacterCode(characterCode)
          this.buffer.push(characterCode)
          bufferIndex++;
        }

      // Now `this.cursorPosition` is "caught up" to the place the cursor was. So, we add our new character there. 
      this.bufferCharacterCode(characterCode);

      // And now, run through the rest of the buffer (but do not move cursor)
      oldBuffer.slice(bufferIndex).forEach((characterCode) => this.bufferCharacterCode(characterCode, false))
    }
  }
}