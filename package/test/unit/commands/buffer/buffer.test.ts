import { commands } from "../../../../src"
import { util } from "../../../../src"
import { Ascii, sleep } from "../../../../src/util"

describe("Buffer", () => {
  it("should echo back a character and a cursor motion for a single character input", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(writtenCharacter)
    await stdout.wait()

    expect(stdout.read()).toMatchObject([Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should handle backspaces", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(writtenCharacter)
    stdin.write(Ascii.Codes.Backspace)

    await(stdout.wait())

    expect(stdout.read()).toMatchObject(
      [
        Ascii.Codes.RightArrow,
        writtenCharacter,
        Ascii.Codes.LeftArrow,
        Ascii.Codes.Backspace
      ])
  })

  it("should handle left/right arrows", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(writtenCharacter)

    await stdout.wait()
    expect(stdout.read()).toMatchObject([Ascii.Codes.RightArrow, writtenCharacter])

    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.RightArrow)

    await stdout.wait()

    expect(stdout.read()).toMatchObject([ Ascii.Codes.LeftArrow, Ascii.Codes.RightArrow])
  })

  it("should ignore backspaces when empty", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.Backspace)
    stdin.write(writtenCharacter)

    await stdout.wait()

    expect(stdout.read()).toMatchObject([ Ascii.Codes.RightArrow, writtenCharacter] )
  })

  it("should ignore left arrow when empty", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()

    expect(stdout.read()).toMatchObject([ Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should ignore right arrow when empty", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.RightArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()

    expect(stdout.read()).toEqual([Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should ignore up arrow when empty", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.UpArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()
    expect(stdout.read()).toEqual([Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should ignore down arrow when empty", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.DownArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()
    expect(stdout.read()).toEqual([Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should send to stdout whatever text we send to stdin", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    let testSentence = `
      This is a ~silly~ \`sentence\`! Why is it silly?

      It just tries stuff, you know? \t \n

      There's a quick brown fox and a lazy dog. And some jumping going on. Story is over.

      Over;Punctuated-Store! :"?<;mSw['aot;gkh O1[  P2
        [lB{}]]]
    `

    let charCodes = Ascii.stringToCharacterCodes(testSentence)

    stdin.write(charCodes)

    await stdout.wait()

    let resultCharCodes = stdout.read().filter((x) => util.Ascii.isVisibleText(x))

    expect(resultCharCodes).toMatchObject(charCodes)
  })

  it("Should handle two backspaces", async () => {
    let targetChars = [
      Ascii.Codes.RightArrow,
      97,
      Ascii.Codes.RightArrow,
      99,
      Ascii.Codes.RightArrow,
      100,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.Backspace,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.Backspace
    ];

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    stdin.write(97)
    stdin.write(99)
    stdin.write(100)
    stdin.write(Ascii.Codes.Backspace)
    stdin.write(Ascii.Codes.Backspace)

    await stdout.wait()

    let newChars = stdout.read()

    expect(newChars).toMatchObject(targetChars)
  })

  it("should handle middle of line backspace", async () => {
    let targetChars = [
      Ascii.Codes.RightArrow,
      97,
      Ascii.Codes.RightArrow,
      99,
      Ascii.Codes.RightArrow,
      100,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.Backspace,
      Ascii.Codes.Backspace,
      100
    ];

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    stdin.write(97)
    stdin.write(99)
    stdin.write(100)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.Backspace)

    await stdout.wait()

    let newChars = stdout.read()

    expect(newChars).toMatchObject(targetChars)
  })

  it("should handle single line middle insertions to the buffer correctly", async () => {
   let targetChars = [
      Ascii.Codes.RightArrow,
      97,
      Ascii.Codes.RightArrow,
      99,
      Ascii.Codes.RightArrow,
      100,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.LeftArrow,
      Ascii.Codes.RightArrow,
      Ascii.Codes.Backspace,
      Ascii.Codes.Backspace,
      98,
      99,
      100]

      let stdin = new util.Stream<number>()
      let stdout = new util.Stream<number>()
      let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    stdin.write(97)
    stdin.write(99)
    stdin.write(100)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(98)

    await stdout.wait()

    let newChars = stdout.read()

    expect(newChars).toMatchObject(targetChars)
  })
})