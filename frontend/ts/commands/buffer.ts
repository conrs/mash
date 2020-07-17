/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import Stream from "../util/stream.js";
import { Ascii } from "../util/ascii.js";
import { CursorPositionHandler } from "../util/cursorPositionHandler.js";
import { BaseCommand } from "./baseCommand.js";
import { asyncPoll } from "../util/asyncPollPromise.js";

export class Buffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"

  private cursorPosition: CursorPositionHandler
  private buffer: number[]

  constructor(
    stdin: Stream<number>,
    stdout: Stream<number>,
    width?: number, 
  ) {
    super(stdin, stdout)
    this.cursorPosition = new CursorPositionHandler(width)
  }

  static async run(stdin: Stream<number>, stdout: Stream<number>, args: string[]): Promise<number> {
    let width = args[0] ? parseInt(args[0], 10) : undefined

    return new Buffer(stdin, stdout, width).run(args)
  }

  async run(args: string[]): Promise<number> {
    if(args.length > 1) {
      Stream.writeString(this.stdout, `Too many arguments passed to ${this.name}: ${args}`)
      return 1;
    }

    return new Promise(async (resolve, reject) => {
      await asyncPoll(this.stdin.read, (characterCode) => {
        this.cursorPosition.handleCharacterCode(characterCode)

        if(Ascii.isPrintableCharacterCode(characterCode)) {
          this.bufferCharacterCode(characterCode)
        }

        return false;
      })
      // If stdin gets closed, we exit successfully
      resolve(0);
    })
  }

  private bufferCharacterCode(characterCode: number, moveCursor: boolean = true) {
    if(!moveCursor || this.cursorPosition.isAtEnd()) {
      this.buffer.push(characterCode)
      this.stdout.write(characterCode)
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