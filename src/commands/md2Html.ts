import { Ascii } from "../util/ascii";
import { Either, Left, Right } from "../util/either";
import { Stream } from "../util/stream";
import { Command } from "./baseCommand";
import { default as MashBuffer}  from "./buffer"
import { Stream as MashStream}  from "../util/stream"
import { sleep } from "../util/sleep";
import { parse } from 'jekyll-markdown-parser';

export default class Md2Html extends Command {
    private buffer: MashBuffer = new MashBuffer()
    
    command: string = "md2html"
    helpText: string = "accept markdown in STDIN, convert to HTML"
    constructor(
    ) {
        super()    
    }

    async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
        const bufferStdin: MashStream<number> = new MashStream<number>()
        const bufferStdout: MashStream<number> = new MashStream<number>()
        
        
        this.buffer.run(bufferStdin, bufferStdout)

        const resultEither = await stdin.consume(async (characterCodes) => {
            for(let i = 0; i < characterCodes.length; i++) {
                let characterCode = characterCodes[i]

                if( Ascii.Codes.EndOfTransmission === characterCode ) {
                    await sleep(5)
                    const html = parse(this.buffer.getBufferString()).html
                    this.buffer.reset()
                    stdout.write(Ascii.stringToCharacterCodes(html))
                    return false
                } else {
                    bufferStdin.write(characterCode)
                }
            }
        })

        if(Either.isLeft(resultEither)) {
            console.error("md2html - Received StreamAlreadyHasListenerError while consuming stream.")
        }

        return 0;
    }
}