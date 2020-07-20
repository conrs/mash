// /**
//  * Window manages:
//  *    - Buffering and displaying output
//  *    - Cursor position & blinking (to indicate to user they should type)
//  *    - Capturing the user's input
//  *    - Passing along commands to the parser
//  */

// import { Stream }from "./util/stream.js";
// import { Ascii } from "./util/ascii.js";
// import { CursorPositionHandler } from "./util/cursorPositionHandler.js";

import * as mash from "conrs-mash"

/**
 * CLIWindow holds a buffer and is in charge of keeping the viewport accurate - 
 * this means refreshing the cursor position, state, and keeping the buffer filled. 
 */
export class BrowserCLIWindow {
  private cursorVisible: boolean
  private buffer: mash.commands.Buffer
  private stdout: mash.util.Stream<number>

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
    let widthInCharacters = Math.floor(this.outputElement.clientWidth / cursorElement.clientWidth)

    this.stdout = new mash.util.Stream<number>()
    this.buffer = new mash.commands.Buffer(this.stdin, this.stdout, widthInCharacters)

    this.buffer.run()
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

    // Handle writing stdout to the screen 
    mash.util.consumeRepeatedly(this.stdout, (character) => {
      if(character == mash.util.Ascii.Codes.ClearScreen) {
        this.outputElement.innerText = ""
      } else if(mash.util.Ascii.isPrintableCharacterCode(character)) {
        this.outputElement.innerText += mash.util.Ascii.getPrintableCharacter(character)
      }
      this.cursorElement.style.left = (this.buffer.cursorPosition.getX() * (Math.round((cursorElement.clientWidth * 1.14) * 100) / 100)).toString()
      this.cursorElement.style.top = (this.buffer.cursorPosition.getY() * cursorElement.clientHeight).toString()

      return false;
    })
  }
}
