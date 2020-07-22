/**
 * Window manages:
 *    - Buffering and displaying output
 *    - Cursor position & blinking (to indicate to user they should type)
 *    - Capturing the user's input
 *    - Passing along commands to the parser
 */

import { Stream }from "../util/stream";
import { Ascii } from "../util/ascii";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
import { util } from "..";

export class Buffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"
  

  private bufferXYIndices: number[][] = [[]] // Tracks the index in `buffer` that a given x, y coordinate refers to.
                                             // For any given (x, y) index, (x+1, y) >= (x, y) && (0, y+1) >= (x, y)
  public cursorX: number = 0
  public cursorY: number = 0
  public buffer: string = ""

  constructor(
    stdin: Stream<number>,
    stdout: Stream<number>,
    public maxWidth: number = 100, 
  ) {
    super(stdin, stdout)
    this.bufferXYIndices = [[]]
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
        this.handleCharacterCode(characterCode, true)
        return true;
      }).then(() => resolve(0))
    })
  }

  private isAtEndOfBuffer(): boolean {
    return (
      this.cursorY == this.bufferXYIndices.length - 1 &&
      this.cursorX == this.bufferXYIndices[this.cursorY].length
    )
  }

  
  private bufferIndex(x: number = this.cursorX, y: number = this.cursorY): number {
    return this.bufferXYIndices[y][x]
  }

  private handleCharacterCode(characterCode: number, shouldWriteStdout: boolean = true): boolean {
    if(Ascii.isVisibleText(characterCode)) {
      if(this.isAtEndOfBuffer()) {
        // The cursor is at the end of our current line. 

        if(characterCode == Ascii.Codes.Backspace) {
          if(this.cursorX > 0) {
            this.cursorX--;
          } else if(this.cursorY > 0) {
            this.cursorY--;
            this.cursorX = this.bufferXYIndices[this.cursorY].length
          } else {
            return false;
          }

          this.buffer = this.buffer.substring(0, this.buffer.length - 1)
        } else if(this.cursorX == this.maxWidth) {
          // Darn, we gotta shuffle this one in on the next line. 
          // Fortunately we can just increment our cursor and then call ourselves again. 

          if(shouldWriteStdout)
            this.stdout.write(Ascii.Codes.NewLine)

          this.nextLine()
          return this.handleCharacterCode(characterCode, shouldWriteStdout)
        } else {
          this.bufferXYIndices[this.cursorY][this.cursorX] = this.buffer.length;
          this.buffer += String.fromCharCode(characterCode)
          this.cursorX++;

          if(characterCode == Ascii.Codes.NewLine) {
            this.nextLine()
          }
        }

        if(shouldWriteStdout) {
          this.stdout.write(characterCode)
        }

        return true;
      } else {
        if(characterCode == Ascii.Codes.Backspace) {
          if(this.cursorX == 0 && this.cursorY == 0) {
            return false;
          }

          let lhs = this.buffer.substring(0, this.bufferIndex()-1)
          let rhs = this.buffer.substring(this.bufferIndex())
  
          this.buffer = lhs + rhs
      
          let newLineArray = [];
      
          for(let x = 0; x < this.cursorX; x++) {
            newLineArray.push(this.bufferXYIndices[this.cursorY][x])
          }
      
          for(let x = this.cursorX+1; x < this.bufferXYIndices[this.cursorY].length; x++) {
            newLineArray.push(this.bufferXYIndices[this.cursorY][x] - 1)
          }
      
          for(let y = this.cursorY; y < this.bufferXYIndices.length; y++) {
            for(let x = 0; x < this.bufferXYIndices[y].length; x++) {
              this.bufferXYIndices[y][x] = this.bufferXYIndices[y][x] - 1
            }
          }
      
          // replace our line's buffer with our new buffer
          this.bufferXYIndices[this.cursorY] = newLineArray
    
      
          // decrement our cursor position
          this.cursorX--;
      
          // flush and rewrite buffer if applicable
          if(shouldWriteStdout) {
            this.flushAndRewriteBuffer()
          }
        } else {
          let lhs = this.buffer.substring(0, this.bufferIndex())
          let rhs = this.buffer.substring(this.bufferIndex())
      

          this.buffer = lhs + String.fromCharCode(characterCode) + rhs
      
          let newLineArray = [];
      
          for(let x = 0; x <= this.cursorX; x++) {
            newLineArray.push(this.bufferXYIndices[this.cursorY][x])
          }
      
          newLineArray.push(this.bufferXYIndices[this.cursorY][this.cursorX] + 1)
      
          for(let x = this.cursorX + 1; x < this.bufferXYIndices[this.cursorY].length; x++) {
            // we add 1 below because the string offset will have changed by one (to make room for our inserted char)
            newLineArray.push(this.bufferXYIndices[this.cursorY][x] + 1)
          }
      
          // bump the index for every following position in our buffer
          for(let y = this.cursorY; y < this.bufferXYIndices.length; y++) {
            for(let x = 0; x < this.bufferXYIndices[y].length; x++) {
              this.bufferXYIndices[y][x] = this.bufferXYIndices[y][x] + 1
            }
          }
      
          // replace our line's buffer with our new buffer
          this.bufferXYIndices[this.cursorY] = newLineArray
      
          if(this.bufferXYIndices.length > this.maxWidth) {
            let oldCursorX = this.cursorX;
            let oldCursorY = this.cursorY;
  // TOSO  
            // trickery - just shift it, then pretend we're doing a new insert at the end of the next line
            // this.nextLine()
            // console.log(this.bufferXYIndices)
            // console.log(this.cursorY)
            // this.cursorX = this.bufferXYIndices[this.cursorY].length
      
            // this.handleCharacterCode(this.bufferXYIndices[this.cursorY].shift(), false)
      
            // this.cursorX = oldCursorX
            // this.cursorY = oldCursorY
          }
      
          // increment our cursor position
          this.cursorX++;
      
          // flush and rewrite buffer if applicable
          if(shouldWriteStdout) {
            this.flushAndRewriteBuffer()
          }
        }
        

        return true;
      }  
    } else {
      let success = false;
      switch(characterCode) {
        case Ascii.Codes.DownArrow: 
          success = this.moveDown();
          break;
        case Ascii.Codes.UpArrow: 
          success = this.moveUp();
          break;
        case Ascii.Codes.LeftArrow:
          success = this.moveLeft();
          break;
        case Ascii.Codes.RightArrow:
          success = this.moveRight();
          break;
        case Ascii.Codes.Delete: 
          success = false;
          break;
        default:
          success = true;
      }

      if(success && shouldWriteStdout) {
        this.stdout.write(characterCode)
      }
    }
  }


  private moveLeft(): boolean {
    if(this.cursorX > 0) {
      this.cursorX--;
      return true;
    } else {
      return false;
    }
  }

  private moveRight(): boolean {
    if(this.cursorX < this.bufferXYIndices[this.cursorY].length) {
      this.cursorX++;
      return true;
    } else {
      return false;
    }
  }

  private moveUp(): boolean {
    if(this.cursorY > 0) {
      this.cursorY--;
      return true;
    } else {
      return false;
    }
  }

  private moveDown(): boolean {
    if(this.cursorY < this.bufferXYIndices.length - 1) {
      this.cursorY++;
      return true;
    } else {
      return false;
    }
  }
  
  
  private nextLine(resetX: boolean = true) {
    if(typeof(this.bufferXYIndices[this.cursorY + 1])) {
      this.bufferXYIndices[this.cursorY + 1] = []
    }
    this.cursorY++;

    if(resetX)
      this.cursorX = 0;
  }

  private flushAndRewriteBuffer() {
    this.stdout.write(Ascii.Codes.ClearScreen)

    for(let y = 0; y < this.bufferXYIndices.length; y++) {
      for(let x = 0; x < this.bufferXYIndices[y].length; x++) {
        this.stdout.write(this.buffer.charCodeAt(this.bufferXYIndices[y][x]))
      }
    }
  }
}