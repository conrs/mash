import { Ascii } from "../../util";
import { fold } from "../../util/fold";

export abstract class BufferNode {
  constructor(
    public character: number,
    public left: BufferNode = undefined,
    public right: BufferNode = undefined
  )
  {
  }

  static fromString(str: String): BufferNode {
    return fold(str.split(""), undefined, (acc: BufferNode, x: string) => {
      let node = new CharacterNode(x.charCodeAt(0), acc)

      if(acc) {
        acc.right = node
      }
      return node
    })
  }
}

export class CharacterNode extends BufferNode {
}
export class HardWrapNode extends BufferNode {
  constructor(
    public left: BufferNode = undefined,
    public right: BufferNode = undefined
  ) {
    super(Ascii.Codes.NewLine, left, right)
  }
}

