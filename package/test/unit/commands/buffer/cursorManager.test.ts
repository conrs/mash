import { commands } from "../../../../src"
import { util } from "../../../../src"
import { Ascii, sleep } from "../../../../src/util"
import { CursorManager, BufferNode, CharacterNode } from "../../../../src/commands/buffer"

describe("CursorManager", () => {
  describe("emitMoves" , () => {
    it("handles positive x and y", async () => {
      let stream = new util.Stream<number>()
      let cat= new CursorManager(stream) as any

      let node = new CharacterNode("a".charCodeAt(0))

      cat.handleMoves({x: 1, y: 2})

      await stream.wait()

      let result = stream.read()

      expect(result).toMatchObject([Ascii.Codes.RightArrow, Ascii.Codes.DownArrow, Ascii.Codes.DownArrow])
      expect(cat.point.x).toBe(1)
      expect(cat.point.y).toBe(2)
    })

    it("handles negative x and y", async () => {
      let stream = new util.Stream<number>()
      let cat= new CursorManager(stream) as any

      cat.handleMoves({x: -1, y: -2})

      await stream.wait()

      let result = stream.read()

      expect(result).toMatchObject([Ascii.Codes.LeftArrow, Ascii.Codes.UpArrow, Ascii.Codes.UpArrow])
      expect(cat.point.x).toBe(-1)
      expect(cat.point.y).toBe(-2)
    })
  })
  describe("handleNode", () => {
    it("returns true when a move is valid", () => {
      let cat= new CursorManager(new util.Stream())
      let node = new CharacterNode("a".charCodeAt(0))

      expect(cat.handleNode(node)).toBe(true)
    })
    it("returns false when a move is invalid", () => {
      let cat= new CursorManager(new util.Stream())
      let node = new CharacterNode(Ascii.Codes.LeftArrow)

      expect(cat.handleNode(node)).toBe(false)
    })
  })
  describe("getMoves", () => {
    it("will advance x if alpha numeric character entered", () => {
      let cat= new CursorManager(new util.Stream())
      let node = new CharacterNode("a".charCodeAt(0))

      // TODO: figure out more elegant way to access/test private methods
      let moves = (cat as any).getMovesForNode(node) as {x: number, y: number, newNode: BufferNode}

      expect(moves).toEqual({
        x: 1,
        y: 0,
        newNode: node
      })
    })

    describe("left moves", () => {
      it("will calculate left move if it jumps to previous line", () => {
        let node = BufferNode.fromString("hello there\n")
        let cat= new CursorManager(new util.Stream(), node, {x: 0, y: 1}) as any

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.LeftArrow, node))).toMatchObject({
          x: 10,
          y: -1,
          newNode: node.left
        })
      })

      it("will calculate left move", () => {
        let node = BufferNode.fromString("hello there")
        let cat= new CursorManager(new util.Stream(), node, {x: 0, y: 1}) as any

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.LeftArrow, node))).toMatchObject({
          x: -1,
          y: 0,
          newNode: node.left
        })
      })

      it("will error if left move impossible", () => {
        let node = BufferNode.fromString("p")

        let cat = new CursorManager(new util.Stream(), node.left, {x: 1, y: 0}) as any

        try {
          cat.getMovesForNode(new CharacterNode(Ascii.Codes.LeftArrow, node))
        } catch(e) {
          expect(e.message).toBe("Moving left is not possible")
        }

        expect.assertions(1)
      })
    })

    describe("special cases", () => {
      it("will calculate backspace move if it jumps to previous line", () => {
        let node = BufferNode.fromString("hello there\n")
        let cat= new CursorManager(new util.Stream(), node, {x: 0, y: 1}) as any

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.LeftArrow, node))).toMatchObject({
          x: 10,
          y: -1,
          newNode: node.left
        })
      })

      it("will handle delete character if node exists to right", () => {
        let node = BufferNode.fromString("he")
        let cat= new CursorManager(new util.Stream(), node.left, {x: 1, y: 0}) as any

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.Delete, node))).toMatchObject({
          x: 0,
          y: 0,
          newNode: node.left
        })
      })

      it("will not handle delete if no node exists to right", () => {
        let node = BufferNode.fromString("he")
        let cat= new CursorManager(new util.Stream(), node, {x: 2, y: 0}) as any

        try {
          cat.getMovesForNode(new CharacterNode(Ascii.Codes.Delete, node))
        } catch(e) {
          expect(e.message).toBe("No character to the right of current cursor")
        }

        expect.assertions(1)
      })

      it("handles newline character correctly", () => {
        let node = BufferNode.fromString("hello")
        let cat= new CursorManager(new util.Stream(), node, {x: 5, y: 0}) as any
        let newNode = new CharacterNode(10, node)

        expect(cat.getMovesForNode(newNode)).toMatchObject({
          x: -5,
          y: 1,
          newNode: newNode
        })
      })
    })




    describe("up moves", () => {
      it("will calculate up arrow move", () => {
        let node = BufferNode.fromString("hello there\n")
        let cat= new CursorManager(new util.Stream(), node, {x: 0, y: 1}) as any
        let newNode = new CharacterNode(Ascii.Codes.UpArrow, node)
        while(node.left) {
          node = node.left
        }

        expect(cat.getMovesForNode(newNode)).toMatchObject({
          x: 0,
          y: -1,
          newNode: node
        })
      })

      it("will calculate up arrow move to as far right as possible if current line is longer than previous line", () => {
        let node = BufferNode.fromString("hello\ni like turtles")
        let cat= new CursorManager(new util.Stream(), node, {x: 14, y: 1}) as any
        let result = cat.getMovesForNode(new CharacterNode(Ascii.Codes.UpArrow, node))
  
        expect(result.x).toBe(-10)
        expect(result.y).toBe(-1)
        expect(result.newNode.character).toBe("o".charCodeAt(0))
      })

      it("throws an error if up move impossible", () => {
        let node = BufferNode.fromString("poop")

        let cat = new CursorManager(new util.Stream(), node, {x: 4, y: 0}) as any

        try {
          cat.getMovesForNode(new CharacterNode(Ascii.Codes.UpArrow, node))
        } catch(e) {
          expect(e.message).toBe("Moving up is not possible")
        }

        expect.assertions(1)
      })
    })


    describe("down moves", () => {
      it("handles down move where current line length <= line below length", () => {
        let node = BufferNode.fromString("hello\n there")
  
  
        while(node.character != "o".charCodeAt(0)) {
          node = node.left
        }
  
        let cat = new CursorManager(new util.Stream(), node, {x: 5, y: 0}) as any
  
        let targetNode = node
        while(targetNode.right) {
          targetNode = targetNode.right
        }

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.DownArrow, node))).toMatchObject({
          x: 0,
          y: 1,
          newNode: targetNode
        })
      })

      it("handles a down move if line below is shorter than current line", () => {
        let node = BufferNode.fromString("hello\ncat")

        while(node.character != "o".charCodeAt(0)) {
          node = node.left
        }

        let cat = new CursorManager(new util.Stream(), node, {x: 4, y: 0}) as any

        let targetNode = node
        while(targetNode.right) {
          targetNode = targetNode.right
        }

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.DownArrow, node))).toMatchObject({
          x: -2,
          y: 1,
          newNode: targetNode
        })
      })

      it("throws an error if down move impossible", () => {
        let node = BufferNode.fromString("poop")

        let cat = new CursorManager(new util.Stream(), node, {x: 4, y: 0}) as any

        try {
          cat.getMovesForNode(new CharacterNode(Ascii.Codes.DownArrow, node))
        } catch(e) {
          expect(e.message).toBe("Moving down is not possible")
        }

        expect.assertions(1)
      })
    })

    describe("right moves", () => {
      it("will handle legal move", () => {
        let node = BufferNode.fromString("he")
  
        let cat = new CursorManager(new util.Stream(), node.left, {x: 0, y: 0}) as any
  
        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.RightArrow, node))).toMatchObject({
          x: 1,
          y: 0,
          newNode: node
        })
      })

      it("will handle move with line break", () => {
        let node = BufferNode.fromString("hello\nthere")
        let oNode = node
  
        while(oNode.character != "o".charCodeAt(0)) {
          oNode = oNode.left
        }

        let cat = new CursorManager(new util.Stream(), oNode, {x: 4, y: 0}) as any

        expect(cat.getMovesForNode(new CharacterNode(Ascii.Codes.RightArrow, oNode))).toMatchObject({
          x: -4,
          y: 1,
          newNode: oNode.right
        })
      })

      it("will error if right move impossible", () => {
        let node = BufferNode.fromString("hello\nthere")
  
  
        let cat = new CursorManager(new util.Stream(), node, {x: 4, y: 0}) as any
  
        try {
          cat.getMovesForNode(new CharacterNode(Ascii.Codes.RightArrow, node))
        } catch(e) {
          expect(e.message).toBe("Moving right is not possible")
        }

        expect.assertions(1)
      })
    })

  })
})