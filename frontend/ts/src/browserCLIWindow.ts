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

import { Buffer } from "./commands/buffer.js"
import { Stream }from "./util/stream.js"
import { consumeRepeatedly } from "./util/consumeRepeatedly.js"
import { Ascii } from "./util/ascii.js"

/**
 * CLIWindow holds a buffer and is in charge of keeping the viewport accurate - 
 * this means refreshing the cursor position, state, and keeping the buffer filled. 
 */
export class BrowserCLIWindow {
  private cursorVisible: boolean
  private buffer: Buffer
  private stdout: Stream<number>

  /**
   * 
   * @param outputElement The element output should be written to (via innerHTML)
   * @param cursorElement An element which should be a square exactly 1 character width and 1 character height, with solid color.
   * @param stdin A stream of ASCII characters corresponding to user input.
   */
  constructor(
    private outputElement: HTMLElement,
    private cursorElement: HTMLElement,
    private stdin: Stream<number>
  ) {
    let widthInCharacters = Math.floor(this.outputElement.clientWidth / cursorElement.clientWidth)

    this.stdout = new Stream<number>()
    this.buffer = new Buffer(this.stdin, this.stdout, widthInCharacters)

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
    consumeRepeatedly(this.stdout, (character) => {
      if(character == Ascii.Codes.ClearScreen) {
        this.outputElement.innerText = ""
      } else if(Ascii.isPrintableCharacterCode(character)) {
        this.outputElement.innerText += Ascii.getPrintableCharacter(character)
      }
      this.cursorElement.style.left = (this.buffer.cursorPosition.getX() * (Math.round((cursorElement.clientWidth * 1.14) * 100) / 100)).toString()
      this.cursorElement.style.top = (this.buffer.cursorPosition.getY() * cursorElement.clientHeight).toString()

      return false;
    })
  }
}
// export class Buffer {
//   private cursorPosition: CursorPositionHandler
//   private cursorVisible: boolean;
//   private buffer: string = ""
//   private stdout: Stream<number> = new Stream<number>()

//   constructor(
//     private stdin: Stream<number>,
//     private outputBufferUpdater: (output: String) => any,
//     private cursorUpdater: (xPosition: number, yPosition: number, visible: boolean) => any,
//     width: number, // Width (in characters) of the screen
//   ) {
//     this.cursorPosition = new CursorPositionHandler(width)
    
//     // Set up the cursor blink and position updater
//     setInterval(() => {
//       // The cursor is visible if stdin is being waited on. 
//       if(this.stdin.hasListeners()) {
//         this.cursorVisible = !this.cursorVisible 
//       } else {
//         this.cursorVisible = false;
//       }
//       cursorUpdater(this.cursorPosition.getX(), this.cursorPosition.getY(), this.cursorVisible)
//     }, 600)

//     // Read stdout to update buffer and position
//     let stdoutListenHelper = (characterCode: number) => {
//       if(characterCode == Ascii.Codes.Bell || !this.cursorPosition.handleCharacterCode(characterCode)) {
//         console.log("DING dont do that")
//       }
//       if(Ascii.isPrintableCharacterCode(characterCode)) {
//         let character = Ascii.getPrintableCharacter(characterCode)
        
//         this.buffer += character;

//         outputBufferUpdater(this.buffer)
//       }
//       // TODO: handle signals

//       this.stdout.read().then(stdoutListenHelper)
//     }

//     this.stdout.read().then(stdoutListenHelper)

//     let characterStreamHelper = (character: number) => {
//       this.stdin.write(character)

//       this.asciiCharacterStream.read().then(characterStreamHelper)
//     }
//     this.asciiCharacterStream.read().then(characterStreamHelper)
//   }

//   public resize(newWidth: number) {
//     this.cursorPosition.resize(newWidth, this.buffer)
//   }
// }