import { Ascii, Stream } from "../../util";
import { BaseCommand } from "..";
import { CursorManager } from "./cursorManager";
import { BufferNode, CharacterNode, HardWrapNode } from "./bufferNode";


/**
 * This command handles cursor positioning as well as buffering of input, allowing for in-place editing of
 * multiple lines of input.
 */
export class Buffer extends BaseCommand {
  name = "buffer"
  helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"

  // Our two main tasks share the same underlying data - a doubly linked list of nodes representing the characters in our buffer.
  private cursorManager: CursorManager // This handles "moves" and determines the series of up, right, down, or left characters to emit.
                                       // as well as our X, Y position currently in the buffer.

  private lastNode: BufferNode  // The end of the doubly linked list of ASCII characters. Used when inserting or removing characters.

  // We buffer our stdout because we might write a bunch of characters - doing them 1 per event loop is not great.
  private stdout: Stream<number>
  private maxWidth: number

  constructor() {
    super()

  }

  async run(stdin: Stream<number>, stdout: Stream<number>, args: string[] = []): Promise<number> {
    this.maxWidth = args[0] ? parseInt(args[0], 10) : Number.MAX_SAFE_INTEGER

    if(this.maxWidth <= 0 || !Number.isInteger(this.maxWidth)) {
      throw new Error(`Invalid max width: ${this.maxWidth}. Must be a positive integer`)
    }

    this.stdout = stdout
    this.cursorManager = new CursorManager(this.stdout)

    if(args.length > 1) {
      stdout.write(Ascii.stringToCharacterCodes(`Too many arguments passed to ${this.name}: ${args}`))
      return 1;
    }

    return new Promise((resolve, _) => {
      stdin.consume((characterCodes) => {
        for(let i = 0; i < characterCodes.length; i++) {
          let characterCode = characterCodes[i]

          if(characterCode == Ascii.Codes.StartOfText) {
            this.cursorManager.clear()
            this.lastNode = undefined
            this.stdout.write(Ascii.Codes.StartOfText)
          } else {
            this.handleCharacterCode(characterCode)
          }
        }
      }).catch(() => resolve(1))
    })
  }

  private handleCharacterCode(characterCode: number) {
    let node = new CharacterNode(characterCode, this.cursorManager.nodeToLeft)
    let isAtEndOfBuffer = !this.lastNode || this.cursorManager.nodeToLeft == this.lastNode || this.cursorManager.nodeToLeft?.left == this.lastNode

    if(this.cursorManager.handleNode(node)) {
      if(Ascii.isVisibleText(characterCode)) {
        if(isAtEndOfBuffer) {
          // Simple case; we are at end of buffer.
          this.lastNode = this.cursorManager.nodeToLeft
          this.stdout.write(node.character)

          // Handle hard wrap
          if(this.cursorManager.point.x >= this.maxWidth) {
            this.cursorManager.handleNode(new HardWrapNode(this.lastNode))
            this.lastNode = this.cursorManager.nodeToLeft
            this.stdout.write(Ascii.Codes.NewLine)
          }
        } else {
          let pendingNodes: BufferNode[] = []
          let temp = this.lastNode

          let target = characterCode == Ascii.Codes.Backspace ? this.cursorManager.nodeToLeft : this.cursorManager.nodeToLeft.left

          while(temp != target) {
            this.stdout.write(Ascii.Codes.Backspace)

            // We throw away hard wrap nodes ( we will recalculate them )
            if(temp instanceof CharacterNode)
              pendingNodes.push(temp)

            temp = temp.left
          }

          if(characterCode == Ascii.Codes.Backspace) {
            this.stdout.write(characterCode)
          } else if(target) {
            this.stdout.write(this.cursorManager.nodeToLeft.character)
          } else {
            this.stdout.write(characterCode)
          }

          let newCursorManager = new CursorManager(new Stream(), this.cursorManager.nodeToLeft, this.cursorManager.point)
          let last = this.cursorManager.nodeToLeft
          while(pendingNodes.length > 0) {
            let node = pendingNodes.pop()
            node.left = last
            last.right = node

            this.stdout.write(node.character)
            newCursorManager.handleNode(node)

            if(newCursorManager.point.x == this.maxWidth) {
              let newLineNode = new HardWrapNode(node)
              this.stdout.write(Ascii.Codes.NewLine)

              node.right = newLineNode
              newCursorManager.handleNode(newLineNode)

              last = newLineNode
            } else {
              last = node
            }
          }
        }
      }
    }
  }
}

