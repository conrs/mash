/**
 * Window manages:
 *    - Buffering and displaying output
 *    - 2D Cursor management & blinking (to indicate to user they should type)
 *    - Passing along commands to the parser
 * 
 * TODO:
 *    - Update the cursor movement logic to target coordinates - this will let us handle HTML rendering as well
 *      as soft wrapping as done by the DOM/stylesheets.
 *          I suspect that 
 */
import { default as MashBuffer}  from "./commands/buffer"
import Mash from "./commands/mash"
import { Ascii } from "./util/ascii"
import { Either } from "./util/either"
import { Stream as MashStream } from "./util/stream"
/**
 * Manages:
 *    - Buffering and displaying output
 *    - 2D Cursor management & blinking (to indicate to user they should type)
 *    - Passing along all inputs to a standard Mash command.
 */
export default class CursoredBufferElementManager {
  private cursorVisible: boolean = false

  private buffer: string = ""
  private bufferDirty: boolean = false;
  private bufferTimeoutExists: boolean = false;
  private bufferIndex: number = -1;

  private seekDirection: "Up" | "Down" | "None" = "None"
  private previousCursorRect: DOMRect | undefined
  
  /**
   *
   * @param outputElement The element output should be written to (via innerHTML)
   * @param cursorElement An element which should be a square exactly 1 character width and 1 character height, with solid color.
   * @param stdin A stream of Ascii characters corresponding to user input.
   */
  constructor(
    private outputElement: HTMLElement,
    private cursorElement: HTMLElement,
    private cursorFillerElement: HTMLElement,
    private stdin: MashStream<number>
  ) {
    let stdout = new MashStream<number>()
    // Trickery for getting the width (some browsers will say it's 0 when the element is hidden)
    cursorElement.style.visibility = ""
  
    ;(window as any).readBuffer = () =>  this.buffer

    // Now we run "mash" but hook up its stdout to our buffer's stdin

    let starterText = this.outputElement.innerHTML
    this.outputElement.innerHTML = ""

    const bufferStdin = new MashStream<number>();
    const mashStdout = new MashStream<number>();

    const buffer = new MashBuffer()
    const mash = new Mash()
    
    buffer.run(bufferStdin, stdout)

    bufferStdin.write(Ascii.stringToCharacterCodes(starterText))
    
    mash.run(stdin, mashStdout)

    mashStdout.consume((x) => {
      for(let i = 0; i < x.length; i++) {
        const char = x[i]

        if(char === Ascii.Codes.UpArrow) {
          this.handleUpPress()
        } else if(char === Ascii.Codes.DownArrow) {
            this.handleDownPress()
        }

        bufferStdin.write(char)
      }
    })

    // Initialize cursor (blink if STDIN is waiting for input TODO remove )
    setInterval(() => {
      if(this.stdin.hasListener()) {
        this.cursorVisible = !this.cursorVisible
      } else {
        this.cursorVisible = false;
      }
      this.cursorElement.style.visibility = this.cursorVisible ? "hidden" : ""
    }, 600)

    // Process stdout from child commands. Render this and manage cursor position.
    setInterval(async () => {
      let bufferEither = stdout.read()
      
      if(Either.isLeft(bufferEither)) {
        alert("DOMAdapter - error reading from stdout")
      } else { 
        if(Either.getValue(bufferEither).length > 0) {
          this.processCharacters(Either.getValue(bufferEither))
          ;(window as any).lastChars = Either.getValue(bufferEither)
  
          if(this.bufferDirty && !this.bufferTimeoutExists) {
            this.bufferTimeoutExists = true 
            setTimeout(() => {
              this.outputElement.innerHTML = this.buffer
              this.bufferDirty = false
              this.bufferTimeoutExists = false 
              window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" })
            }, 5)
          }
            
          this.cursorFillerElement.innerHTML = this.buffer.substring(0, this.bufferIndex + 1)
        }
      }
    }, 10)

  }

  // convertUpIntoLeftMoves(): number {
  //   // Read buffer, split last line, 
  // }

  handleUpPress(): void {
    // Kind of weird, but let the dom tell us, just keep feeding left arrows until the cursor is at its same horizontal position
    // or less. 
    
    this.seekDirection = "Up";
  
    this.previousCursorRect = this.cursorElement.getBoundingClientRect()
    this.stdin.write(Ascii.Codes.LeftArrow)
  }

  handleDownPress(): void {
    // Kind of weird, but let the dom tell us, just keep feeding left arrows until the cursor is at its same horizontal position
    // or less. 
    this.seekDirection = "Down";
  
    this.previousCursorRect = this.cursorElement.getBoundingClientRect()
    this.stdin.write(Ascii.Codes.RightArrow)
  }

  private processCharacters(characters: number[]) {
    characters.forEach((character) => {
      switch(character) {
        // case Ascii.Codes.StartOfText:
        //   document.getElementsByTagName("body")[0].scrollTop = document.getElementsByTagName("body")[0].clientHeight * 20
        //   break;
        case Ascii.Codes.LeftArrow:
          this.bufferIndex--;

          setTimeout(() => {
            if(this.seekDirection === "Up" && this.previousCursorRect) {
              if (Math.abs(this.cursorElement.getBoundingClientRect().top - this.previousCursorRect.top) <= 1 || this.cursorElement.getBoundingClientRect().left > this.previousCursorRect.left )
              {
                this.stdin.write(Ascii.Codes.LeftArrow)
              } else {
                this.seekDirection = "None"
                this.previousCursorRect = undefined;
              }
            }
          }, 1)

          break;
        case Ascii.Codes.RightArrow:
          this.bufferIndex++;

          setTimeout(() => {
            if(this.seekDirection === "Down" && this.previousCursorRect) {
              if (Math.abs(this.cursorElement.getBoundingClientRect().top - this.previousCursorRect.top) <= 1 || this.cursorElement.getBoundingClientRect().left < this.previousCursorRect.left )
              {
                this.stdin.write(Ascii.Codes.RightArrow)
              } else {
                this.seekDirection = "None"
                this.previousCursorRect = undefined;
              }
            }
          }, 1)
          break;
        case Ascii.Codes.Backspace:
          this.bufferDirty = true;
          this.buffer = this.buffer.substring(0,this.buffer.length - 1)
          break;
        default:
          if(Ascii.isVisibleText(character)) {
            this.buffer += Ascii.characterCodesToString([character])
            this.bufferDirty = true
          }

          break;
      }
    })
  }
}