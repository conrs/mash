import { commands } from "../../../src/";
import { util } from "../../../src";
describe("buffer", () => {
    it("should send to stdout whatever text we send to stdin", async () => {
        let stdin = new util.Stream();
        let stdout = new util.Stream();
        let buffer = new commands.Buffer(stdin, stdout);
        let testSentence = `
      This is a ~silly~ \`sentence\`! Why is it silly? 

      It just tries stuff, you know? \t \n

      There's a quick brown fox and a lazy dog. And some jumping going on. Story is over. 
    `;
        for (let i = 0; i < testSentence.length; i++) {
            stdin.write(testSentence.charCodeAt(i));
            expect(await stdout.read()).toBe(testSentence.charCodeAt(i));
        }
    });
});
//# sourceMappingURL=buffer.test.js.map