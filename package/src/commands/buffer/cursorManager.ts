import { Ascii } from "../../util";
import { BufferNode } from "./bufferNode";
import { Point } from "./point";

export class CursorManager {
  // Since we track our position using the "nodeToLeft", we have to handle the case where
  // we have seeked back to the beginning of the buffer. Here, nodeToLeft would be undefined,
  // so we populate this field when we use left arrows or backspaces to move left.
  private ohMagicRightNode: BufferNode

  constructor(
    public stdout: { write(char: number): void },
    public nodeToLeft: BufferNode = undefined,
    public point: Point = new Point(0, 0)
  ) { }

  /**
   * @param character Character that was entered
   * @param newNode If a new node was created, pass it here, it is used for cases where the buffer is being appended to.
   */
  handleNode(node: BufferNode): boolean {
    try {
      let moves = this.getMovesForNode(node)

      this.nodeToLeft = moves.newNode

      this.handleMoves(moves)

      return true;
    } catch(e) {
      return false;
    }
  }

  clear() {
    this.nodeToLeft = undefined
    this.point = new Point(0, 0)
    this.ohMagicRightNode = undefined
  }

  private handleMoves(moves: {x: number, y: number}) {
    let xCharacter = moves.x < 0 ? Ascii.Codes.LeftArrow : Ascii.Codes.RightArrow
    let yCharacter = moves.y < 0 ? Ascii.Codes.UpArrow : Ascii.Codes.DownArrow
    let xTarget = Math.abs(moves.x)
    let yTarget = Math.abs(moves.y)

    for(let i = 0; i < xTarget; i++) {
      this.stdout.write(xCharacter)
    }

    for(let i = 0; i < yTarget; i++) {
      this.stdout.write(yCharacter)
    }

    this.point.x += moves.x
    this.point.y += moves.y
  }

  private getMovesForNode(node: BufferNode): {x: number, y: number, newNode: BufferNode} {
    switch(node.character) {
      case Ascii.Codes.CarriageReturn:
        if(this.nodeToLeft) {
          let temp = this.nodeToLeft

          while(temp.left && temp.left.character != Ascii.Codes.NewLine) {
            temp = temp.left
          }

          return {x: this.point.x * -1, y: 0, newNode: temp}
        } else {
          throw new Error("Carriage return does nothing")
        }
      case Ascii.Codes.DownArrow:
        let magicNode2 = this.nodeToLeft ? this.nodeToLeft.right : this.ohMagicRightNode
        this.ohMagicRightNode = undefined
        let nextLine = this.getLine(magicNode2, "down")
        if(nextLine.length > 0) {
          let bestXPosition = Math.min(this.point.x, nextLine.length - 1)

          return {x: bestXPosition - this.point.x, y: 1, newNode: nextLine[bestXPosition]}
        } else {
          throw new Error("Moving down is not possible")
        }
      case Ascii.Codes.UpArrow:
        let previousLine = this.getLine(this.nodeToLeft, "up")
        if(previousLine.length > 0) {
          let bestXPosition = Math.min(this.point.x, previousLine.length - 1)
          return {x: bestXPosition - this.point.x, y: - 1, newNode: previousLine[bestXPosition]}
        } else {
          throw new Error("Moving up is not possible")
        }
      case Ascii.Codes.Backspace:
        if(this.nodeToLeft) {
          let newLeft = this.nodeToLeft.left
          let newRight = this.nodeToLeft.right
  
          if(newLeft)
            newLeft.right = newRight
  
          if(newRight)
            newRight.left = newLeft
  
          if(Ascii.Codes.NewLine == this.nodeToLeft.character) {
            let previousLine = this.getLine(this.nodeToLeft, "up")
  
            this.ohMagicRightNode = this.nodeToLeft
            return {x: previousLine.length - 1 - this.point.x, y: -1, newNode: this.nodeToLeft.left}
          } else {
            this.ohMagicRightNode = this.nodeToLeft
            return {x: -1, y: 0, newNode: this.nodeToLeft.left}
          }
        }
        break
      case Ascii.Codes.LeftArrow:
        if(this.nodeToLeft) {
          this.ohMagicRightNode = this.nodeToLeft
          if(Ascii.Codes.NewLine == this.nodeToLeft.character) {
            let previousLine = this.getLine(this.nodeToLeft, "up")

            this.ohMagicRightNode = this.nodeToLeft
            return {x: previousLine.length - 1 - this.point.x, y: -1, newNode: this.nodeToLeft.left}
          } else {
            this.ohMagicRightNode = this.nodeToLeft
            return {x: -1, y: 0, newNode: this.nodeToLeft.left}
          }
        } else {
          throw new Error("Moving left is not possible")
        }
      case Ascii.Codes.RightArrow:
        let magicNode = this.nodeToLeft ? this.nodeToLeft.right : this.ohMagicRightNode
        this.ohMagicRightNode = undefined
        if(magicNode) {
          if(Ascii.Codes.NewLine == magicNode.character) {
            return {x: -1 * this.point.x, y: 1, newNode: magicNode}
          } else {
            return {x: 1, y: 0, newNode: magicNode}
          }
        } else {
          throw new Error("Moving right is not possible")
        }
      case Ascii.Codes.Delete:
        if(!this.nodeToLeft.right) {
          throw new Error("No character to the right of current cursor")
        } else {
          return {x: 0, y: 0, newNode: this.nodeToLeft}
        }
      case Ascii.Codes.NewLine:
        return {
          x: -1 * this.point.x,
          y: 1,
          newNode: node
        }
      default:
        this.ohMagicRightNode = undefined
        node.left = this.nodeToLeft
        if(this.nodeToLeft) {
          this.nodeToLeft.right = node
        }
        return {
          x: 1,
          y: 0,
          newNode: node
        }
    }
  }

  private getLine(node: BufferNode, dir: 'up' | 'down'): BufferNode[] {
    let t: BufferNode = node
    let result: BufferNode[] = []
    let direction: "left" | "right" = dir == "up" ? "left" : "right"

    if(t) {
      while(t[direction] && t.character != Ascii.Codes.NewLine) {
        t = t[direction]
      }

      t = t[direction]

      while(t && t.character != Ascii.Codes.NewLine) {
        result.push(t)
        t = t[direction]
      }
  
      if(direction == 'left') {
        result = result.reverse()
      }
    }

    return result;
  }

}
