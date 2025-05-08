import { Stream } from "../../src/util/stream"
import {default as BufferCommand} from "../../src/commands/buffer"
import { Ascii } from "../../src/util/ascii"
import { Either } from "../../src/util/either"

describe("Buffer", () => {
  it("should echo back a character and a cursor motion for a single character input", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(writtenCharacter)
    await stdout.wait()

    const resultEither = stdout.read() 
    
    expect(Either.isLeft(resultEither)).toBe(false)
    expect(Either.getValue(resultEither)).toMatchObject([Ascii.Codes.RightArrow, writtenCharacter])
  })

  it("should handle backspaces", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write([writtenCharacter, Ascii.Codes.Backspace])

    await(stdout.wait())

    const resultEither = stdout.read() 

    expect(Either.getValue(resultEither)).toMatchObject(
      [
        Ascii.Codes.RightArrow,
        writtenCharacter,
        Ascii.Codes.LeftArrow,
        Ascii.Codes.Backspace,
      ])
  })

  it("should handle left/right arrows", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(writtenCharacter)

    await stdout.wait()

    const resultEither = stdout.read() 

    expect(Either.getValue(resultEither)).toMatchObject([Ascii.Codes.RightArrow, writtenCharacter])

    // Only the first of each moves is valid, the other should receive a NACK
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.RightArrow)
    stdin.write(Ascii.Codes.RightArrow)

    await stdout.wait()

    const resultEither2 = stdout.read()

    expect(Either.getValue(resultEither2)).toMatchObject([ Ascii.Codes.LeftArrow, Ascii.Codes.NACK, Ascii.Codes.RightArrow, Ascii.Codes.NACK])
  })

  it("should ignore backspaces when empty", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.Backspace)
    stdin.write(writtenCharacter)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject([ Ascii.Codes.NACK, Ascii.Codes.RightArrow, writtenCharacter] )
  })

  it("should ignore delete if empty", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.Delete)
    stdin.write(writtenCharacter)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject([ Ascii.Codes.NACK, Ascii.Codes.RightArrow, writtenCharacter] )
  })

  it("should ignore left arrow when empty", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject([ Ascii.Codes.NACK, Ascii.Codes.RightArrow, writtenCharacter] )
  })

  it("should ignore right arrow when empty", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write(Ascii.Codes.RightArrow)
    stdin.write(writtenCharacter)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject([ Ascii.Codes.NACK, Ascii.Codes.RightArrow, writtenCharacter] )
  })

  it("should ignore up arrow and down arrows", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

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

    stdin.write(Ascii.Codes.UpArrow)
    stdin.write(Ascii.Codes.DownArrow)

    await stdout.wait()
    
    const resultEither = stdout.read()

    if(Either.isLeft(resultEither)) {
        expect(Either.isLeft(resultEither)).toBe(false) 
    } else {
        let resultCharCodes = Either.getValue(resultEither).filter((x) => Ascii.isVisibleText(x))

        expect(resultCharCodes.find((x) => x === Ascii.Codes.UpArrow)).toBeUndefined()
        expect(resultCharCodes.find((x) => x === Ascii.Codes.DownArrow)).toBeUndefined()
    }
  })

  it("should send to stdout whatever text we send to stdin", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()

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

    const resultEither = stdout.read()

    if(Either.isLeft(resultEither)) {
        expect(Either.isLeft(resultEither)).toBe(false) 
    } else {
        let resultCharCodes = Either.getValue(resultEither).filter((x) => Ascii.isVisibleText(x))

        expect(resultCharCodes).toMatchObject(charCodes)
    }
  })

  it("should handle delete if valid", async () => {
    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()
    let writtenCharacter = "a".charCodeAt(0)

    buffer.run(stdin, stdout)

    stdin.write([writtenCharacter, Ascii.Codes.LeftArrow, Ascii.Codes.Delete])

    await(stdout.wait())

    const resultEither = stdout.read() 

    expect(Either.getValue(resultEither)).toMatchObject(
      [
        Ascii.Codes.RightArrow,
        writtenCharacter,
        Ascii.Codes.LeftArrow,
        Ascii.Codes.Backspace,
      ])
  })


  it("should handle inserting a character", async () => {
    let targetChars = [
        Ascii.Codes.RightArrow,
        97,
        Ascii.Codes.RightArrow,
        99,
        Ascii.Codes.RightArrow,
        100,
        Ascii.Codes.LeftArrow,
        Ascii.Codes.Backspace,      // Delete end 
        Ascii.Codes.RightArrow,     // Move cursor for new character
        96,                         // New character
        100
      ];
  
  
      let stdin = new Stream<number>()
      let stdout = new Stream<number>()
      let buffer = new BufferCommand()
  
      buffer.run(stdin, stdout)
  
      stdin.write(97)
      stdin.write(99)
      stdin.write(100)
      stdin.write(Ascii.Codes.LeftArrow)
      stdin.write(96)
  
      await stdout.wait()
  
      const resultEither = stdout.read()
  
      expect(Either.getValue(resultEither)).toMatchObject(targetChars)
  })

  it("should handle inserting two characters", async () => {
    let targetChars = [
        Ascii.Codes.RightArrow,
        97,
        Ascii.Codes.RightArrow,
        99,
        Ascii.Codes.RightArrow,
        100,
        Ascii.Codes.LeftArrow,
        Ascii.Codes.Backspace,      // Delete end 
        Ascii.Codes.RightArrow,     // Move cursor for new character
        96,                         // New character
        100,
        Ascii.Codes.Backspace,      // Delete end 
        Ascii.Codes.RightArrow,     // Move cursor for new character
        95,                         // New character
        100
      ];
  
  
      let stdin = new Stream<number>()
      let stdout = new Stream<number>()
      let buffer = new BufferCommand()
  
      buffer.run(stdin, stdout)
  
      stdin.write(97)
      stdin.write(99)
      stdin.write(100)
      stdin.write(Ascii.Codes.LeftArrow)
      stdin.write(96)
      stdin.write(95)
  
      await stdout.wait()
  
      const resultEither = stdout.read()
  
      expect(Either.getValue(resultEither)).toMatchObject(targetChars)
  })

  it("should handle middle of line backspace", async () => {
    let targetChars = [
      Ascii.Codes.RightArrow,
      97,
      Ascii.Codes.RightArrow,
      99,
      Ascii.Codes.RightArrow,
      100,
      // Left arrow 
      Ascii.Codes.LeftArrow,

      // Backspace + Left Arrow
      Ascii.Codes.LeftArrow,
      Ascii.Codes.Backspace,
      Ascii.Codes.Backspace,
      100
    ];


    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()

    buffer.run(stdin, stdout)

    stdin.write(97)
    stdin.write(99)
    stdin.write(100)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.Backspace)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject(targetChars)
  })

  it("should handle middle of line delete", async () => {
    let targetChars = [
      Ascii.Codes.RightArrow,
      97,
      Ascii.Codes.RightArrow,
      99,
      Ascii.Codes.RightArrow,
      100,
      // Left arrows
      Ascii.Codes.LeftArrow,
      Ascii.Codes.LeftArrow,
      
      // Delete two spots and write only one, no cursor moves. 
      Ascii.Codes.Backspace,
      Ascii.Codes.Backspace, 
      100
    ];

    let stdin = new Stream<number>()
    let stdout = new Stream<number>()
    let buffer = new BufferCommand()

    buffer.run(stdin, stdout)

    stdin.write(97)
    stdin.write(99)
    stdin.write(100)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.Delete)

    await stdout.wait()

    const resultEither = stdout.read()

    expect(Either.getValue(resultEither)).toMatchObject(targetChars)
  })
})