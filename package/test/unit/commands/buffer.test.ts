import { commands } from "../../../src/"
import { util } from "../../../src"
import { Ascii, sleep } from "../../../src/util"

describe("buffer", () => {
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

    for(let i = 0; i < testSentence.length; i++) {
      stdin.write(testSentence.charCodeAt(i))
      let char = await stdout.read()

      expect(char).toBe(testSentence.charCodeAt(i))
    }
  })

  it("Buffer.run works same as instance run()", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()

    commands.Buffer.run(stdin, stdout)

    let testSentence = `
      This is a ~silly~ \`sentence\`! Why is it silly? 

      It just tries stuff, you know? \t \n

      There's a quick brown fox and a lazy dog. And some jumping going on. Story is over. 

      Over;Punctuated-Store! :"?<;mSw['aot;gkh O1[  P2
      [lB{}]]]
    `

    for(let i = 0; i < testSentence.length; i++) {
      stdin.write(testSentence.charCodeAt(i))

      expect(await stdout.read()).toBe(testSentence.charCodeAt(i))
    }
  })

  it("should not emit moves to STDOUT if there is nothing in the buffer", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    stdin.write(util.Ascii.Codes.DownArrow)
    stdin.write(util.Ascii.Codes.LeftArrow)
    stdin.write(util.Ascii.Codes.RightArrow)
    stdin.write(util.Ascii.Codes.UpArrow)
    stdin.write(97)

    expect(await stdout.read()).toBe(97)
  });

  it("handles single line boundaries for cursor movement", async () => {
    let testLine = "cat pizza attack"

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    // Ensure you can cursor left right back to the start of the string, but no further.
    for(let i = 0; i < testLine.length; i++) {
      stdin.write(testLine.charCodeAt(i))
      
      // read back but throw away the characters we wrote
      await stdout.read()
    }

    for(let i = 0; i < testLine.length; i++) {
      stdin.write(util.Ascii.Codes.LeftArrow)

      expect(await stdout.read()).toBe(util.Ascii.Codes.LeftArrow)
    }

    stdin.write(util.Ascii.Codes.LeftArrow)
    stdin.write(util.Ascii.Codes.RightArrow)

    expect(await stdout.read()).toBe(util.Ascii.Codes.RightArrow)

    // Ensure you can cursor right to the end of the string, and no further.

    for(let i = 0; i < testLine.length - 1; i++) {
      stdin.write(util.Ascii.Codes.RightArrow)

      expect(await stdout.read()).toBe(util.Ascii.Codes.RightArrow)
    }

    stdin.write(util.Ascii.Codes.RightArrow)
    stdin.write(97)

    expect(await stdout.read()).toBe(97)
  })

  it("handles up/down boundaries for multiple lines of input", async() => {
    let numNewlines = 10
    let testLine = "\n\n\n\n\n\n\n\n\n\n"
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)
    // Ensure you can cursor left right back to the start of the string, but no further.
    for(let i = 0; i < testLine.length; i++) {
      stdin.write(testLine.charCodeAt(i))
      
      // read back but throw away the characters we wrote
      await stdout.read()
    }

    for(let i = 0; i < numNewlines; i++) {
      stdin.write(util.Ascii.Codes.UpArrow)

      expect(await stdout.read()).toBe(util.Ascii.Codes.UpArrow)
    }

    stdin.write(util.Ascii.Codes.UpArrow)
    stdin.write(util.Ascii.Codes.DownArrow)

    expect(await stdout.read()).toBe(util.Ascii.Codes.DownArrow)

    for(let i = 0; i < numNewlines-1; i++) {
      stdin.write(util.Ascii.Codes.DownArrow)

      expect(await stdout.read()).toBe(util.Ascii.Codes.DownArrow)
    }

    stdin.write(util.Ascii.Codes.DownArrow)
    stdin.write(util.Ascii.Codes.RightArrow)
    stdin.write(97)

    expect(await stdout.read()).toBe(97)
  })

  it("clears buffer and rewrites if text inserted midway through buffer", async () => {
    let testString = "cattle"

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)
    for(let i = 0; i < testString.length; i++) {
      stdin.write(testString.charCodeAt(i))

      await stdout.read()
    }

    stdin.write(util.Ascii.Codes.LeftArrow)
    stdin.write(util.Ascii.Codes.LeftArrow)
    stdin.write(util.Ascii.Codes.LeftArrow)
    await stdout.read()
    await stdout.read()
    await stdout.read()


    // Write a 'a' character
    stdin.write("a".charCodeAt(0))
    // We expect a "clear screen" then a flush of the buffer
    expect(await stdout.read()).toBe(util.Ascii.Codes.ClearScreen)
    expect(await stdout.read()).toBe("c".charCodeAt(0))
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("l".charCodeAt(0))
    expect(await stdout.read()).toBe("e".charCodeAt(0))
    // k lets try adding another character ( the cursor shouldn't be at the end)

    stdin.write("3".charCodeAt(0))

    expect(await stdout.read()).toBe(util.Ascii.Codes.ClearScreen)
    expect(await stdout.read()).toBe("c".charCodeAt(0))
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("3".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("l".charCodeAt(0))
    expect(await stdout.read()).toBe("e".charCodeAt(0))
  });

  it("will insert a newline if line exceeds width", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer(1)

    buffer.run(stdin, stdout)

    stdin.write(97)

    expect(await stdout.read()).toBe(97)

    stdin.write(97)

    expect(await stdout.read()).toBe(util.Ascii.Codes.NewLine)
    expect(await stdout.read()).toBe(97)
  })

  it("will allow backspace at end of line", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer(1)

    buffer.run(stdin, stdout)

    stdin.write(97)

    expect(await stdout.read()).toBe(97)

    stdin.write(Ascii.Codes.Backspace)

    expect(await stdout.read()).toBe(Ascii.Codes.Backspace)
  })

  it("will handle backspace in middle of word", async() => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.Buffer()

    buffer.run(stdin, stdout)

    stdin.write("c".charCodeAt(0))
    await stdout.read()
    stdin.write("a".charCodeAt(0))
    await stdout.read()
    stdin.write("a".charCodeAt(0))
    await stdout.read()
    stdin.write("t".charCodeAt(0))
    await stdout.read()
    stdin.write(Ascii.Codes.LeftArrow)
    await stdout.read()
    stdin.write(Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(Ascii.Codes.ClearScreen)
    expect(await stdout.read()).toBe("c".charCodeAt(0))
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
  })

  it("will handle newlines in the middle of the buffer", async() => {
    let stdin = new util.BufferedStreamWriter<number>()
    let stdout = new util.BufferedStreamReader<number>()
    let testString = "hey there \n"
    let moves = [util.Ascii.Codes.UpArrow]
    let expectedString = "\nhey there \n"
    
    commands.Buffer.run(stdin.underlying, stdout.underlying)

    await stdin.write(util.Ascii.stringToCharacterCodes(testString))
    await sleep(50)
    expect(Ascii.characterCodesToString(stdout.read())).toBe(testString)

    await stdin.write(moves)
    await sleep(50)
    expect(stdout.read()).toEqual(moves)

    await stdin.write([Ascii.Codes.NewLine])
    await sleep(50)
    let result = stdout.read()

    expect(result[0]).toBe(Ascii.Codes.ClearScreen)

    expect(Ascii.characterCodesToString(result.slice(1))).toBe(expectedString)
  })

  it("will handle deletes in the middle of the buffer", async() => {
    let stdin = new util.BufferedStreamWriter<number>()
    let stdout = new util.BufferedStreamReader<number>()
    let testString = "hey there \n"
    let moves = [util.Ascii.Codes.UpArrow, util.Ascii.Codes.RightArrow, util.Ascii.Codes.RightArrow]
    let expectedString = "hy there \n"
    commands.Buffer.run(stdin.underlying, stdout.underlying)

    await stdin.write(util.Ascii.stringToCharacterCodes(testString))
    await sleep(50)
    expect(Ascii.characterCodesToString(stdout.read())).toBe(testString)

    await stdin.write(moves)
    await sleep(50)
    expect(stdout.read()).toEqual(moves)

    await stdin.write([Ascii.Codes.Backspace])
    await sleep(50)
    let result = stdout.read()

    expect(result[0]).toBe(Ascii.Codes.ClearScreen)

    expect(Ascii.characterCodesToString(result.slice(1))).toBe(expectedString)
  })

  it("should exit if we close stdin", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()

    let promise = commands.Buffer.run(stdin, stdout)

    stdin.end()

    expect(await promise).toBe(1)
  })
})