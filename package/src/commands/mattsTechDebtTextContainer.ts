import { Stream }from "../util/stream";
import { Ascii } from "../util/ascii";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
import { util } from "..";
import { BufferedStreamWriter } from "../util";

/**
 * This class simply handles width and height for multiple lines of output. It's kind of just a big
 * flashing sign of technical debt I've yet to rename.
 *
 * I haven't as I intend to eventually extend singleLineBuffer to handle multiple lines, at which point
 * this class can be replaced by it.
 */
export class MattsTechDebtTextContainer extends BaseCommand {
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

    return new MattsTechDebtTextContainer(width).run(stdin, stdout, args)
  }

  async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    this.bufferedStdout = new BufferedStreamWriter(stdout)
    if(args.length > 1) {
      Stream.writeString(stdout, `Too many arguments passed to ${this.name}: ${args}`)
      return 1;
    }

    return new Promise((resolve, _) => {
      consumeRepeatedly(stdin, (characterCode) => {
        this.handleCharacterCode(characterCode, true)
        return true;
      }).catch(() => resolve(1))
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
    // if(this.cursorX > 0) {
      this.cursorX--
      if(shouldWriteStdout) 
        this.bufferedStdout.write(util.Ascii.Codes.LeftArrow)
      return true
    // } else {
    //   return false
    // }
  }

  private moveRight(shouldWriteStdout: boolean = false): boolean {
    // if(this.cursorX < this.bufferXYIndices[this.cursorY].length) {
      this.cursorX++
      if(shouldWriteStdout) 
        this.bufferedStdout.write(util.Ascii.Codes.RightArrow)
      return true
    // } else {
    //   return false
    // }
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
}