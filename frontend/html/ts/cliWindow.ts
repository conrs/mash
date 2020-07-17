/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import Stream from "./stream.js";
import { Ascii } from "./ascii.js";


class CursorPositionHandler {
  private x: number;
  private y: number;
  private xOffset: number;
  private yOffset: number;

  constructor(
    private maxWidth: number
  ) {
    this.xOffset = 0;
    this.yOffset = 0;
    this.x = 0;
    this.y = 0;
  }

  getX() {
    return this.x + this.xOffset;
  }

  getY() {
    return this.y + this.yOffset;
  }

  resize(newWidth: number, buffer: string) {
    this.constructor(newWidth)
    this.accountFor(buffer)
  }

  moveLeft(): boolean {
    if(this.x + this.xOffset > 0) {
      this.xOffset--;
      return true;
    } else {
      return false;
    }
  }

  moveRight(): boolean {
    if(this.xOffset < 0) {
      this.xOffset++;
      return true;
    } else {
      return false;
    }
  }

  accountFor(value: string) {
    // we reset any offsets to the cursor position when new data comes in
    this.xOffset = 0;
    this.yOffset = 0;

    for(let i = 0; i < value.length; i++) {
      if(value.charAt(i) == "\n") {
        this.newLine()
      } else {
        if(this.x == this.maxWidth) {
          this.newLine()
        }

        this.x++;
      }
    }
  }


  // moveUp(): boolean {
  //   if(this.y + this.yOffset > 0) {
  //     this.yOffset--;
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // moveDown(): boolean {
  //   if(this.yOffset < 0) {
  //     this.yOffset--;
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }


  private newLine() {
    this.x = 0;
    this.y++;
  }
}
export class CLIWindow {
  private cursorPosition: CursorPositionHandler
  private cursorVisible: boolean;
  private buffer: string = ""
  private stdin: Stream<number> = new Stream<number>()
  private stdout: Stream<number> = new Stream<number>()

  constructor(
    public asciiCharacterStream: Stream<number>,
    private outputBufferUpdater: (output: String) => any,
    private cursorUpdater: (xPosition: number, yPosition: number, visible: boolean) => any,
    width: number, // Width (in characters) of the screen
  ) {
    this.cursorPosition = new CursorPositionHandler(width)
    
    // Set up the cursor blink and position updater
    setInterval(() => {
      // The cursor is visible if stdin is being waited on. 
      if(this.asciiCharacterStream.hasListeners()) {
        this.cursorVisible = !this.cursorVisible 
      } else {
        this.cursorVisible = false;
      }
      cursorUpdater(this.cursorPosition.getX(), this.cursorPosition.getY(), this.cursorVisible)
    }, 600)

    // Read stdout to update buffer and position
    let stdoutListenHelper = (characterCode: number) => {
      if(Ascii.isPrintableCharacterCode(characterCode)) {
        let character = Ascii.getPrintableCharacter(characterCode)
        this.cursorPosition.accountFor(character);
        this.buffer += character;

        outputBufferUpdater(this.buffer)
      }
      // TODO: handle signals

      this.stdout.read().then(stdoutListenHelper)
    }

    this.stdout.read().then(stdoutListenHelper)

    let characterStreamHelper = (character: number) => {
      switch(character) {
        case Ascii.Codes.LeftArrow:
          this.cursorPosition.moveLeft()
          break;
        case Ascii.Codes.RightArrow:
          this.cursorPosition.moveRight()
          break;
        default: 
          // TODO: should probably pass along the arrow, and instead obey it when written to stdout 
          // (so scripts can choose to allow/disallow)
          this.stdin.write(character)

          // For hacks, we echo it to stdout
          this.stdout.write(character)
      }
      this.asciiCharacterStream.read().then(characterStreamHelper)
    }
    this.asciiCharacterStream.read().then(characterStreamHelper)
  }

  public resize(newWidth: number) {
    this.cursorPosition.resize(newWidth, this.buffer)
  }
}