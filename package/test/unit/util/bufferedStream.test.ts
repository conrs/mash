import * as util from "../../../src/util"

describe("bufferedstream", () => {
  it("should be able to write and read a whole string", async () => {
    let bufferedStreamWriter = new util.BufferedStreamWriter<number>()
    let bufferedStreamReader = new util.BufferedStreamReader(bufferedStreamWriter.underlying)
    let testString = `hot diggity dog! Golly gosh mcgee! Hah!
    
    this \t is the best!!!`

    await bufferedStreamWriter.write(util.Ascii.stringToCharacterCodes(testString))

    expect(util.Ascii.characterCodesToString(bufferedStreamReader.read())).toBe(testString)
  })
})
