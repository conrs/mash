import { commands } from "../../../src"
import { util } from "../../../src"
import { Ascii, sleep } from "../../../src/util"

describe("SingleLineBuffer", () => {
  it("should send to stdout whatever text we send to stdin", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.SingleLineBuffer()

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

    commands.SingleLineBuffer.run(stdin, stdout)

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
    let buffer = new commands.SingleLineBuffer()

    buffer.run(stdin, stdout)

    stdin.write(util.Ascii.Codes.LeftArrow)
    stdin.write(util.Ascii.Codes.RightArrow)
    stdin.write(97)

    expect(await stdout.read()).toBe(97)
  });

  it("handles single line boundaries for cursor movement", async () => {
    let testLine = "cattle pizza attack"

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.SingleLineBuffer()

    buffer.run(stdin, stdout)

    // Ensure you can cursor left right back to the start of the string, but no further.
    for(let i = 0; i < testLine.length; i++) {
      stdin.write(testLine.charCodeAt(i))

      // read back but throw away the characters we wrote
      await stdout.read();
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
      console.log(i)
      expect(await stdout.read()).toBe(util.Ascii.Codes.RightArrow)
    }

    stdin.write(util.Ascii.Codes.RightArrow)
    stdin.write(97)

    expect(await stdout.read()).toBe(97)
  })

  it("clears buffer and rewrites if text inserted midway through buffer", async () => {
    let testString = "cattle"

    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.SingleLineBuffer()

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
    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe("a".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("l".charCodeAt(0))
    expect(await stdout.read()).toBe("e".charCodeAt(0))
    // k lets try adding another character ( the cursor shouldn't be at the end)

    stdin.write("3".charCodeAt(0))

    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(util.Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe("3".charCodeAt(0))
    expect(await stdout.read()).toBe("t".charCodeAt(0))
    expect(await stdout.read()).toBe("l".charCodeAt(0))
    expect(await stdout.read()).toBe("e".charCodeAt(0))
  });


  it("will allow backspace at end of line", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.SingleLineBuffer()

    buffer.run(stdin, stdout)

    stdin.write(97)

    expect(await stdout.read()).toBe(97)

    stdin.write(Ascii.Codes.Backspace)

    expect(await stdout.read()).toBe(Ascii.Codes.Backspace)
  })

  it("will handle backspace in middle of word", async() => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()
    let buffer = new commands.SingleLineBuffer()

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
    expect(await stdout.read()).toBe(Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe(Ascii.Codes.Backspace)
    expect(await stdout.read()).toBe("t".charCodeAt(0))
  })

  it("will not allow newlines in the middle of the buffer", async() => {
    let stdin = new util.BufferedStreamWriter<number>()
    let stdout = new util.BufferedStreamReader<number>()
    let testString = "hey there"

    commands.SingleLineBuffer.run(stdin.underlying, stdout.underlying)

    await stdin.write(util.Ascii.stringToCharacterCodes(testString))
    await stdin.write(Ascii.Codes.LeftArrow)
    await(sleep(50))
    stdout.read();

    await stdin.write(Ascii.stringToCharacterCodes("\n"))
    await(sleep(10))
    expect(stdout.read()).toEqual([])
  })
  it("will allow newlines at the end of the buffer", async() => {
    let stdin = new util.BufferedStreamWriter<number>()
    let stdout = new util.BufferedStreamReader<number>()
    let testString = "hey there"

    commands.SingleLineBuffer.run(stdin.underlying, stdout.underlying)

    await stdin.write(util.Ascii.stringToCharacterCodes(testString))
    await(sleep(50))
    stdout.read();

    await stdin.write(Ascii.stringToCharacterCodes("\n"))
    await(sleep(10))
    expect(stdout.read()).toEqual([10])
  })

  it("should exit if we close stdin", async () => {
    let stdin = new util.Stream<number>()
    let stdout = new util.Stream<number>()

    let promise = commands.SingleLineBuffer.run(stdin, stdout)

    stdin.end()

    expect(await promise).toBe(1)
  })
})