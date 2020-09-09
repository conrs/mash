// /**
//  * Window manages:
//  *    - Buffering and displaying output
//  *    - Cursor position & blinking (to indicate to user they should type)
//  *    - Capturing the user's input
//  *    - Passing along commands to the parser
//  */

import * as mash from "conrs-mash"
import { consumeRepeatedly } from "conrs-mash/dist/src/util"

/**
 * CLIWindow holds a buffer and is in charge of keeping the viewport accurate -
 * this means refreshing the cursor position, state, and keeping the buffer filled. 
 */
export class BrowserCLIWindow {
  private cursorVisible: boolean
  private techDebtTextContainer: mash.commands.MattsTechDebtTextContainer
  private mash: mash.commands.Mash
  private stdout: mash.util.Stream<number>

  private bufferStdin: mash.util.Stream<number>
  /**
   *
   * @param outputElement The element output should be written to (via innerHTML)
   * @param cursorElement An element which should be a square exactly 1 character width and 1 character height, with solid color.
   * @param stdin A stream of ASCII characters corresponding to user input.
   */
  constructor(
    private outputElement: HTMLElement,
    private cursorElement: HTMLElement,
    private stdin: mash.util.Stream<number>
  ) {
    let widthInCharacters = Math.floor(this.outputElement.clientWidth / cursorElement.clientWidth) - 20

    this.stdout = new mash.util.Stream<number>()
    this.bufferStdin = new mash.util.Stream<number>()

    this.techDebtTextContainer = new mash.commands.MattsTechDebtTextContainer(widthInCharacters)
    this.techDebtTextContainer.run(this.bufferStdin, this.stdout)

    this.writeStringToStdin(this.outputElement.innerHTML, this.bufferStdin)

    // Now we run "mash" but hook up its stdout to our buffer's stdin

    this.mash = new mash.commands.Mash()

    this.mash.run(this.stdin, this.bufferStdin)

    // Handle cursor positioning and blinking
    setInterval(() => {
      // The cursor is visible if stdin is being waited on.
      if(this.stdin.hasListeners()) {
        this.cursorVisible = !this.cursorVisible
      } else {
        this.cursorVisible = false;
      }
      this.cursorElement.style.visibility = this.cursorVisible ? "hidden" : ""
    }, 600)

    setInterval(() => {
      if(this.outputElement.innerHTML != this.techDebtTextContainer.buffer)
        this.outputElement.innerHTML = this.techDebtTextContainer.buffer

      this.cursorElement.style.left = (this.techDebtTextContainer.cursorX * ((Math.round(cursorElement.getBoundingClientRect().width * 10000)*1.11) / 10000)).toString()
      this.cursorElement.style.top = (this.techDebtTextContainer.cursorY * cursorElement.getBoundingClientRect().height).toString()
    }, 20)
  }

  private writeStringToStdin(string: string, stream: mash.util.Stream<number>) {
    if(string != "") {
      stream.write(string.charCodeAt(0))
      this.writeStringToStdin(string.substring(1), stream)
    }
  }
}