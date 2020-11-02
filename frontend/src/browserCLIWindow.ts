// /**
//  * Window manages:
//  *    - Buffering and displaying output
//  *    - Cursor position & blinking (to indicate to user they should type)
//  *    - Capturing the user's input
//  *    - Passing along commands to the parser
//  */

import * as mash from "conrs-mash"
/**
 * CLIWindow holds a buffer and is in charge of keeping the viewport accurate -
 * this means refreshing the cursor position, state, and keeping the buffer filled.
 */
export class BrowserCLIWindow {
  private cursorVisible: boolean
  private cursorX: number = 0
  private cursorY: number = 0

  private mash: mash.commands.Mash

  private buffer: string = ""

  private bufferStdin: mash.util.Stream<number>
  private stdout: mash.util.Stream<number>
  /**
   *
   * @param outputElement The element output should be written to (via innerHTML)
   * @param cursorElement An element which should be a square exactly 1 character width and 1 character height, with solid color.
   * @param stdin A stream of mash.util.Ascii characters corresponding to user input.
   */
  constructor(
    private outputElement: HTMLElement,
    private cursorElement: HTMLElement,
    private stdin: mash.util.Stream<number>
  ) {
    let widthInCharacters = Math.floor((document.body.clientWidth / cursorElement.clientWidth) * .87)

    let stdout = new mash.util.Stream<number>()

    // Now we run "mash" but hook up its stdout to our buffer's stdin

    let starterText = this.outputElement.innerHTML
    this.outputElement.innerHTML = ""

    this.mash = new mash.commands.Mash()
    this.mash.run(stdin, stdout, [widthInCharacters.toString(), starterText])

    // Handle cursor positioning and blinking
    setInterval(() => {
      // The cursor is visible if stdin is being waited on.
      if(this.stdin.hasListener()) {
        this.cursorVisible = !this.cursorVisible
      } else {
        this.cursorVisible = false;
      }
      this.cursorElement.style.visibility = this.cursorVisible ? "hidden" : ""
    }, 600)

    setInterval(async () => {
      let buffer = stdout.read()

      this.processCharacters(buffer)

      if(this.outputElement.innerHTML != this.buffer)
        this.outputElement.innerHTML = this.buffer

      this.cursorElement.style.left = (this.cursorX * ((Math.round(cursorElement.getBoundingClientRect().width * 10000)*1.11) / 10000)).toString()
      this.cursorElement.style.top = (this.cursorY * cursorElement.getBoundingClientRect().height).toString()
    }, 10)
  }

  private processCharacters(characters: number[]) {
    characters.forEach((character) => {
      switch(character) {
        case mash.util.Ascii.Codes.StartOfText:
          // Hackity hack because html might cause line break that doesnt
          // actually show up, so this keeps cursor in order.
          this.cursorY = this.outputElement.innerText.split("\n").length - 1
          break;
        case mash.util.Ascii.Codes.UpArrow:
          this.cursorY = Math.max(0, this.cursorY-1);
          break;
        case mash.util.Ascii.Codes.DownArrow:
          this.cursorY++;
          break;
        case mash.util.Ascii.Codes.LeftArrow:
          this.cursorX = Math.max(0, this.cursorX-1);
          break;
        case mash.util.Ascii.Codes.RightArrow:
          this.cursorX++;
          break;
        case mash.util.Ascii.Codes.Backspace:
          this.buffer = this.buffer.substring(0,this.outputElement.innerHTML.length-1)
          this.outputElement.innerHTML = this.buffer
          break;
        default:
          if(mash.util.Ascii.isVisibleText(character)) {
            this.buffer += mash.util.Ascii.characterCodesToString([character])
          }
          document.getElementsByTagName("body")[0].scrollTop = document.getElementsByTagName("body")[0].clientHeight * 20
          break;
      }
    })
  }
}