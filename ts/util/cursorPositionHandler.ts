import { Ascii } from "./ascii.js";

export class CursorPositionHandler {
  private x: number;
  private y: number;
  private xOffset: number;
  private yOffset: number;

  /**
   * @param maxWidth Maximum width before wrapping to new line, if none specified, effectively infinite
   */
  constructor(
    public maxWidth: number = 1000000000
  ) {
    this.xOffset = 0;
    this.yOffset = 0;
    this.x = 0;
    this.y = 0;
  }

  getX() {
    console.log(`x: ${this.x} offs: ${this.xOffset}`)
    return this.x + this.xOffset;
  }

  getY() {
    return this.y + this.yOffset;
  }

  resize(newWidth: number, buffer: number[]) {
    this.constructor(newWidth)
    this.handleBuffer(buffer)
  }

  handleBuffer(buffer: number[], moveCursor: boolean = true) {
    // we reset any offsets to the cursor position when new data comes in
    if(moveCursor) {
      this.xOffset = 0;
      this.yOffset = 0;
    }

    buffer.forEach((characterCode) => this.handleCharacterCode(characterCode, moveCursor))
  }

  /**
   * Handles the character code passed; including if it is a control character
   * relating to cursor motion. 
   * 
   * @param characterCode ASCII character code
   * @returns whether it could handle the character (e.g. moving left if at x:0 returns false)
   */
  handleCharacterCode(characterCode: number, moveCursor: boolean = true): boolean {
    if(Ascii.isPrintableCharacterCode(characterCode)) {
      if(characterCode == Ascii.Codes.NewLine) {
        this.newLine(moveCursor)
      } else {
        if(this.x == this.maxWidth) {
          this.newLine(moveCursor)
        }

        this.x++;
        if(!moveCursor) {
          this.xOffset--;
        }
      }

      return true;
    } else {
      switch(characterCode) {
        case Ascii.Codes.DownArrow: 
          return this.moveDown();
        case Ascii.Codes.UpArrow: 
          return this.moveUp();
        case Ascii.Codes.LeftArrow:
          return this.moveLeft();
        case Ascii.Codes.RightArrow:
          return this.moveRight();
        default:
          return true;
      }
    }
  }

  isAtEnd() {
    return this.xOffset == 0 && this.yOffset == 0;
  }

  private newLine(moveCursor: boolean = true) {
    this.x = 0;
    this.y++;

    if(!moveCursor) {
      this.yOffset--;
    }
  }

  private moveLeft(): boolean {
    if((this.x + this.xOffset) > 0) {
      console.log("did it")
      this.xOffset--;
      return true;
    } else {
      return false;
    }
  }

  private moveRight(): boolean {
    if(this.xOffset < 0) {
      this.xOffset++;
      return true;
    } else {
      return false;
    }
  }

  private moveUp(): boolean {
    if(this.y + this.yOffset > 0) {
      this.yOffset--;
      return true;
    } else {
      return false;
    }
  }

  private moveDown(): boolean {
    if(this.yOffset < 0) {
      this.yOffset++;
      return true;
    } else {
      return false;
    }
  }
}