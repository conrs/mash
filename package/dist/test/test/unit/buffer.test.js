import { commands } from "../../../src/";
import { util } from "../../../src";
describe("buffer", () => {
    it("should send to stdout whatever text we send to stdin", async () => {
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        buffer.run();
        let testSentence = `
      This is a ~silly~ \`sentence\`! Why is it silly? 

      It just tries stuff, you know? \t \n

      There's a quick brown fox and a lazy dog. And some jumping going on. Story is over. 

      Over;Punctuated-Store! :"?<;mSw['aot;gkh O1[  P2
       [lB{}]]]
    `;
        for (let i = 0; i < testSentence.length; i++) {
            stdin.write(testSentence.charCodeAt(i));
            expect(await stdout.read()).toBe(testSentence.charCodeAt(i));
        }
        stdin.end();
    });
    it("Buffer.run works same as instance run()", async () => {
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        commands.Buffer.run(stdin, stdout);
        let testSentence = `
      This is a ~silly~ \`sentence\`! Why is it silly? 

      It just tries stuff, you know? \t \n

      There's a quick brown fox and a lazy dog. And some jumping going on. Story is over. 

      Over;Punctuated-Store! :"?<;mSw['aot;gkh O1[  P2
      [lB{}]]]
    `;
        for (let i = 0; i < testSentence.length; i++) {
            stdin.write(testSentence.charCodeAt(i));
            expect(await stdout.read()).toBe(testSentence.charCodeAt(i));
        }
    });
    it("should not emit moves to STDOUT if there is nothing in the buffer", async () => {
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        buffer.run();
        stdin.write(util.Ascii.Codes.DownArrow);
        stdin.write(util.Ascii.Codes.LeftArrow);
        stdin.write(util.Ascii.Codes.RightArrow);
        stdin.write(util.Ascii.Codes.UpArrow);
        stdin.write(97);
        expect(await stdout.read()).toBe(97);
    });
    it("handles single line boundaries for cursor movement", async () => {
        let testLine = "cat pizza attack";
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        buffer.run();
        for (let i = 0; i < testLine.length; i++) {
            stdin.write(testLine.charCodeAt(i));
            await stdout.read();
        }
        for (let i = 0; i < testLine.length; i++) {
            stdin.write(util.Ascii.Codes.LeftArrow);
            expect(await stdout.read()).toBe(util.Ascii.Codes.LeftArrow);
        }
        stdin.write(util.Ascii.Codes.LeftArrow);
        stdin.write(util.Ascii.Codes.RightArrow);
        expect(await stdout.read()).toBe(util.Ascii.Codes.RightArrow);
        for (let i = 0; i < testLine.length - 1; i++) {
            stdin.write(util.Ascii.Codes.RightArrow);
            expect(await stdout.read()).toBe(util.Ascii.Codes.RightArrow);
        }
        stdin.write(util.Ascii.Codes.RightArrow);
        stdin.write(97);
        expect(await stdout.read()).toBe(97);
    });
    it("handles up/down boundaries for multiple lines of input", async () => {
        let testLine = "Cat\nDog\nPotatoes\n\nPorky Pig\n\n\nLemons Oldsmobile\n\n\nMEOW";
        let numNewlines = 10;
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        buffer.run();
        for (let i = 0; i < testLine.length; i++) {
            stdin.write(testLine.charCodeAt(i));
            await stdout.read();
        }
        for (let i = 0; i < numNewlines; i++) {
            stdin.write(util.Ascii.Codes.UpArrow);
            expect(await stdout.read()).toBe(util.Ascii.Codes.UpArrow);
        }
        stdin.write(util.Ascii.Codes.UpArrow);
        stdin.write(util.Ascii.Codes.DownArrow);
        expect(await stdout.read()).toBe(util.Ascii.Codes.DownArrow);
        for (let i = 0; i < numNewlines - 1; i++) {
            stdin.write(util.Ascii.Codes.DownArrow);
            expect(await stdout.read()).toBe(util.Ascii.Codes.DownArrow);
        }
        stdin.write(util.Ascii.Codes.DownArrow);
        stdin.write(97);
        expect(await stdout.read()).toBe(97);
    });
    it("clears buffer and rewrites if text inserted midway through buffer", async () => {
        let testString = "cattle";
        let expectedOutput = "catatle";
        let expectedOutput2 = "cata2tle";
        let leftMoves = 3;
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        buffer.run();
        for (let i = 0; i < testString.length; i++) {
            stdin.write(testString.charCodeAt(i));
            await stdout.read();
        }
        for (let i = 0; i < leftMoves; i++) {
            stdin.write(util.Ascii.Codes.LeftArrow);
            await stdout.read();
        }
        stdin.write("a".charCodeAt(0));
        expect(await stdout.read()).toBe(util.Ascii.Codes.ClearScreen);
        expect(await stdout.read()).toBe("c".charCodeAt(0));
        expect(await stdout.read()).toBe("a".charCodeAt(0));
        expect(await stdout.read()).toBe("t".charCodeAt(0));
        expect(await stdout.read()).toBe("t".charCodeAt(0));
        expect(await stdout.read()).toBe("a".charCodeAt(0));
        expect(await stdout.read()).toBe("l".charCodeAt(0));
        expect(await stdout.read()).toBe("e".charCodeAt(0));
        stdin.write("3".charCodeAt(0));
        expect(await stdout.read()).toBe(util.Ascii.Codes.ClearScreen);
        expect(await stdout.read()).toBe("c".charCodeAt(0));
        expect(await stdout.read()).toBe("a".charCodeAt(0));
        expect(await stdout.read()).toBe("t".charCodeAt(0));
        expect(await stdout.read()).toBe("t".charCodeAt(0));
        expect(await stdout.read()).toBe("a".charCodeAt(0));
        expect(await stdout.read()).toBe("3".charCodeAt(0));
        expect(await stdout.read()).toBe("l".charCodeAt(0));
        expect(await stdout.read()).toBe("e".charCodeAt(0));
    });
});
//# sourceMappingURL=buffer.test.js.map