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
import { BufferedStreamReader, BufferedStreamWriter } from "../util";

export class Buffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"
  

  private bufferXYIndices: number[][] = [[]] // Tracks the index in `buffer` that a given x, y coordinate refers to.
                                             // For any given (x, y) index, (x+1, y) >= (x, y) && (0, y+1) >= (x, y)
  private bufferedStdout: BufferedStreamWriter<number>
  public cursorX: number = 0
  public cursorY: number = 0
  public buffer: string = ""

  constructor(
    public maxWidth: number = 100,
  ) {
    super()
    this.bufferXYIndices = [[]]

  }

  static async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    let width = args[0] ? parseInt(args[0], 10) : undefined

    return new Buffer(width).run(stdin, stdout, args)
  }

  async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    this.bufferedStdout = new BufferedStreamWriter(stdout)
    if(args.length > 1) {
      Stream.writeString(stdout, `Too many arguments passed to ${this.name}: ${args}`)
      return 1;
    }

    return new Promise((resolve, reject) => {
      consumeRepeatedly(stdin, (characterCode) => {
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
            this.bufferedStdout.write(Ascii.Codes.NewLine)

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
          this.bufferedStdout.write(characterCode)
        }

        return true;
      } else {
        // TODO: redo all of this multi line stuff. 
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
      
          // increment our cursor position
          this.cursorX++

          if(characterCode == util.Ascii.Codes.NewLine) {
            console.log(this.bufferXYIndices)
            this.bufferXYIndices[this.cursorY] = newLineArray.slice(0, this.cursorX+1)
            this.bufferXYIndices.splice(this.cursorY+1, 0, newLineArray.slice(this.cursorX+1))
            this.nextLine()
          }
          // flush and rewrite buffer if applicable
          if(shouldWriteStdout) {
            this.flushAndRewriteBuffer()
          }
        }

        return true
      }  
    } else {
      switch(characterCode) {
        case Ascii.Codes.DownArrow: 
          return this.moveDown(shouldWriteStdout)
        case Ascii.Codes.UpArrow: 
          return this.moveUp(shouldWriteStdout)
        case Ascii.Codes.LeftArrow:
          return this.moveLeft(shouldWriteStdout)
        case Ascii.Codes.RightArrow:
          return this.moveRight(shouldWriteStdout)
        case Ascii.Codes.Delete: 
          return false;
        default:
          if(shouldWriteStdout)
            this.bufferedStdout.write(characterCode)
          return true
      }
    }
  }


  private moveLeft(shouldWriteStdout: boolean = false): boolean {
    if(this.cursorX > 0) {
      this.cursorX--
      if(shouldWriteStdout) 
        this.bufferedStdout.write(util.Ascii.Codes.LeftArrow)
      return true
    } else {
      return false
    }
  }

  private moveRight(shouldWriteStdout: boolean = false): boolean {
    if(this.cursorX < this.bufferXYIndices[this.cursorY].length) {
      this.cursorX++
      if(shouldWriteStdout) 
        this.bufferedStdout.write(util.Ascii.Codes.RightArrow)
      return true
    } else {
      return false
    }
  }

  private moveUp(shouldWriteStdout: boolean = false): boolean {
    if(this.cursorY > 0) {
      this.cursorY--
      if(shouldWriteStdout) 
        this.bufferedStdout.write(util.Ascii.Codes.UpArrow)
      this.possiblyMoveX(shouldWriteStdout)
     
      return true;
    } else {
      return false;
    }
  }

  private moveDown(shouldWriteStdout: boolean = false): boolean {
    if(this.cursorY < this.bufferXYIndices.length - 1) {
      this.cursorY++
      if(shouldWriteStdout)
        this.bufferedStdout.write(util.Ascii.Codes.DownArrow)
      this.possiblyMoveX(shouldWriteStdout)
      return true;
    } else {
      return false;
    }
  }
  
  private possiblyMoveX(shouldWriteStdout: boolean = false) {
    let newX = Math.max(0, Math.min(this.cursorX, this.bufferXYIndices[this.cursorY].length-1))

    if(shouldWriteStdout) {
      for(let i = 0; i < this.cursorX - newX; i++) {
        this.bufferedStdout.write(util.Ascii.Codes.LeftArrow)
      }
    }
   
    this.cursorX = newX
  }
  
  private nextLine(resetX: boolean = true) {
    if(typeof(this.bufferXYIndices[this.cursorY + 1]) === 'undefined') {
      this.bufferXYIndices[this.cursorY + 1] = []
    }
    this.cursorY++;

    if(resetX)
      this.cursorX = 0;
  }

  private flushAndRewriteBuffer() {
    this.bufferedStdout.clearBuffer()

    this.bufferedStdout.write(Ascii.Codes.ClearScreen)
    this.bufferedStdout.write(Ascii.stringToCharacterCodes(this.buffer))
  }
}