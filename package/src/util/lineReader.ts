import { Stream } from "./stream";
import { Ascii } from "./ascii";

export class LineReader {
  private lineBuffer: string = ""

  constructor(
    private stream: Stream<number>
  ) {}


  async readLine(): Promise<string> {
    await this.stream.consume((characters) => {
      for(let i = 0; i < characters.length; i++) {
        let char = characters[i]
        if(char == Ascii.Codes.NewLine) {
          return false;
        } else if(char == Ascii.Codes.Backspace) {
          this.lineBuffer = this.lineBuffer.substring(0, this.lineBuffer.length - 1);
        } else if(Ascii.Codes.ClearScreen == char) {
          this.lineBuffer = ""
        } else if(Ascii.isVisibleText(char)) {
          this.lineBuffer += Ascii.fromCharCode(char)
        }
      }

      return true
    })

    let line = this.lineBuffer
    this.lineBuffer = ""
    return line
  }
}