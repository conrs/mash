import { Stream }from "../util/stream";
import { Ascii } from "../util/ascii";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
import { util } from "..";
import { BufferedStreamWriter } from "../util";

export class SingleLineBuffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a single line buffer for user input, echoing it to standard out, and controlling for left/right cursor movement"

  private bufferedStdout: BufferedStreamWriter<number>
  public cursorX: number = 0
  public buffer: string = ""

  static async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    return new SingleLineBuffer().run(stdin, stdout, args)
  }

  async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    this.bufferedStdout = new BufferedStreamWriter(stdout)
    if(args.length > 1) {
      Stream.writeString(stdout, `Too many arguments passed to ${this.name}: ${args}`)
      return 1;
    }

    return new Promise((resolve, reject) => {
      consumeRepeatedly(stdin, (characterCode) => {
        this.handleCharacterCode(characterCode)
        return true;
      }).catch(() => resolve(1))
    })
  }



  private handleCharacterCode(characterCode: number): boolean {
    if(Ascii.isVisibleText(characterCode)) {
      // Hack to avoid newlines in the middle
      if(Ascii.Codes.NewLine == characterCode && this.cursorX < this.buffer.length) {
        while(this.moveRight(true));
        return true;
      }

      // Emit backspaces until all characters are removed after the cursor's position
      let flatBufferIndex = this.buffer.length;

      while(flatBufferIndex > this.cursorX) {
        this.bufferedStdout.write(Ascii.Codes.Backspace)
        flatBufferIndex--;
      }

      let offset = 1;
      let bufferAfterCursor = this.buffer.slice(this.cursorX);

      // Add our character to our buffer in-place
      if(characterCode == Ascii.Codes.Backspace) {
        if(this.cursorX == 0) {
          return false;
        }
        offset = -1;
        this.buffer = this.buffer.slice(0, this.cursorX - 1) + bufferAfterCursor;
      } else {
        this.buffer = this.buffer.slice(0, this.cursorX) + Ascii.fromCharCode(characterCode) + bufferAfterCursor;
      }

      // Output the character
      this.bufferedStdout.write(characterCode)

      this.cursorX += offset

      // Reoutput rest of buffer (if applicable)
      if(bufferAfterCursor != "")
        this.bufferedStdout.write(Ascii.stringToCharacterCodes(bufferAfterCursor))

    } else {
      switch(characterCode) {
        case Ascii.Codes.LeftArrow:
          return this.moveLeft(true)
        case Ascii.Codes.RightArrow:
          return this.moveRight(true)
        case Ascii.Codes.Delete:
          return false;
        default:
          this.bufferedStdout.write(characterCode)
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
    if(this.cursorX < this.buffer.length) {
      this.cursorX++
      if(shouldWriteStdout)
        this.bufferedStdout.write(util.Ascii.Codes.RightArrow)
      return true
    } else {
      return false
    }
  }
}