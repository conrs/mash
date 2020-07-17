/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import Stream from "./stream.js";
import { Ascii } from "./ascii.js";
import { CursorPositionHandler } from "./cursorPositionHandler.js";

export class Buffer {
  private cursorPosition: CursorPositionHandler
  private cursorVisible: boolean;
  private buffer: string = ""
  private stdout: Stream<number> = new Stream<number>()

  constructor(
    private stdin: Stream<number>,
    private outputBufferUpdater: (output: String) => any,
    private cursorUpdater: (xPosition: number, yPosition: number, visible: boolean) => any,
    width: number, // Width (in characters) of the screen
  ) {
    this.cursorPosition = new CursorPositionHandler(width)
    
    // Set up the cursor blink and position updater
    setInterval(() => {
      // The cursor is visible if stdin is being waited on. 
      if(this.stdin.hasListeners()) {
        this.cursorVisible = !this.cursorVisible 
      } else {
        this.cursorVisible = false;
      }
      cursorUpdater(this.cursorPosition.getX(), this.cursorPosition.getY(), this.cursorVisible)
    }, 600)

    // Read stdout to update buffer and position
    let stdoutListenHelper = (characterCode: number) => {
      if(characterCode == Ascii.Codes.Bell || !this.cursorPosition.handleCharacterCode(characterCode)) {
        console.log("DING dont do that")
      }
      if(Ascii.isPrintableCharacterCode(characterCode)) {
        let character = Ascii.getPrintableCharacter(characterCode)
        
        this.buffer += character;

        outputBufferUpdater(this.buffer)
      }
      // TODO: handle signals

      this.stdout.read().then(stdoutListenHelper)
    }

    this.stdout.read().then(stdoutListenHelper)

    let characterStreamHelper = (character: number) => {
      this.stdin.write(character)

      this.asciiCharacterStream.read().then(characterStreamHelper)
    }
    this.asciiCharacterStream.read().then(characterStreamHelper)
  }

  public resize(newWidth: number) {
    this.cursorPosition.resize(newWidth, this.buffer)
  }
}