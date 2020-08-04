import { Stream } from "./stream";
import { consumeRepeatedly } from "./consumeRepeatedly";
import { Ascii } from "./ascii";

export class LineReader {
  private lineBuffer: string = ""

  constructor(
    private stream: Stream<number>
  ) {}

  end() {
    this.stream.end()
  }

  async readLine(): Promise<string> {
    await consumeRepeatedly(this.stream, (char) => {
      if(char == Ascii.Codes.NewLine) {
        return false;
      } else if(char == Ascii.Codes.ClearScreen) {
        this.lineBuffer = "";
      } else if(Ascii.isVisibleText(char)) {
        this.lineBuffer += Ascii.fromCharCode(char)
      }

      return true
    })

    let line = this.lineBuffer
    this.lineBuffer = ""
    return line
  }
}