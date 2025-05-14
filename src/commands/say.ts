import { Command } from "./baseCommand";
import Buffer from "./buffer";
import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";

export class Say extends Command {
  command: string = "say"
  helpText: string = "speech to text by our friend, Zarvox"
  async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const bufferStdin = new Stream<number>()
    const buffer = new Buffer()

    buffer.run(bufferStdin, stdout)

    const synth = window.speechSynthesis;
    const voices = synth.getVoices()
    const zarvy = voices.find((x) => x.name === 'Zarvox')!

    // if there are args, just read them out 
    if(args && args.length) {
      const sayIt = new SpeechSynthesisUtterance(args.join(" "));

      console.log(zarvy)
      sayIt.voice = zarvy

      synth.speak(sayIt)
      return 0;
    }

    await stdin.consume(async (characters) => {
        for(let i = 0; i < characters.length; i++) {
            const char = characters[i]
            
            if(Ascii.Codes.EndOfTransmission === char) {
                // It's goofy but we need to wait to let the buffer process any preceeding chars 
                await new Promise<void>((resolve) => {
                  setTimeout(() => {
                    const sayIt = new SpeechSynthesisUtterance(buffer.getBufferString());
                    console.log(buffer.getBufferString())
    
                    console.log(zarvy)
                    sayIt.voice = zarvy
    
                    synth.speak(sayIt)
                    resolve()
                  }, 1);
                })

                return false 
            } else {
              bufferStdin.write(char)
            }
        }
    })

    return 0;
  }
}