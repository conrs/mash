import { Ascii } from "../util/ascii";
import { Either, Left, Right } from "../util/either";
import { Stream } from "../util/stream";
import { Command } from "./baseCommand";
import { default as MashBuffer}  from "../commands/buffer"
import { Stream as MashStream}  from "../util/stream"
import { Ls } from "./ls";
import { Cat } from "./cat";
import { Cd } from "./cd";
import { Rotate } from "./rotate"
import { Filesystem } from "../filesystem/core";
import { GithubBlogFilesystem } from "../filesystem/githubBlogFs";
import { sleep } from "../util/sleep";
import Md2Html from "./md2Html";
import { Help } from "./help";
import { Edit } from "./edit";
import { Say } from "./say";
import { Pwd } from "./pwd";
import { Whoami } from "./whoami";
import { Clear } from "./clear";
import { Echo } from "./echo";
import { Grep } from "./grep";
import { Pager } from "./pager";
import { Man } from "./man";
import { Decode } from "./decode";
import { Strings } from "./strings";
import { HistoryTracker } from "./history";
import { complete } from "./complete";
import { splitPipeline, tokenize } from "../util/tokenize";
import { Arg, Layer, corrupt } from "../arg/layer";

export default class Mash extends Command {
    private buffer: MashBuffer = new MashBuffer()
    private historyTracker = new HistoryTracker()
    private filesystem = new GithubBlogFilesystem()
    
    command: string = "mash"
    helpText: string = "command interpreter - you can be a troll and keep nesting these, currently no way to kill"
    
    prompt = (name: string = "mash") => Layer.active ? this.damagedPrompt(name) : `${name}:/${this.filesystem.pwd.join("/")} $ `

    private damagedPrompt(name: string) {
        const path = "/" + this.filesystem.pwd.join("/")
        const home = "/" + this.filesystem.home().join("/")
        const shownPath = path.startsWith(home) ? "~" + path.substring(home.length) : path

        return `<span class="glitch">${Arg.NAME}@${corrupt(name, Layer.random() < 0.5 ? 1 : 2)}</span>:${shownPath} $ `
    }

    constructor(
    ) {
        super()

        Help.register(new Ls(this.filesystem))
        Help.register(new Cat(this.filesystem))
        Help.register(new Cd(this.filesystem))
        Help.register(new Rotate())
        Help.register(new Md2Html())
        Help.register(new Help())
        Help.register(new Edit())
        Help.register(new Say())
        Help.register(new Pwd(this.filesystem))
        Help.register(new Whoami())
        Help.register(new Clear())
        Help.register(new Echo())
        Help.register(new Grep(this.filesystem))
        Help.register(new Pager("less", this.filesystem))
        Help.register(new Pager("more", this.filesystem))
        Help.register(new Man())
        Help.register(new Decode())
        Help.register(new Strings(this.filesystem))
        Help.register(this)
    }

    run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
        let promptName = "mash"
        
        if(args && args.length === 1) {
            promptName = args[0]
        }
        const bufferStdin: MashStream<number> = new MashStream<number>()
        const bufferStdout: MashStream<number> = new MashStream<number>()
        
        this.buffer.run(bufferStdin, bufferStdout)

        if(Layer.active) {
            this.filesystem.pwd = this.filesystem.home()
            stdout.write(Ascii.stringToCharacterCodes(BANNER))
        }

        return new Promise(async (resolve, _) => {
            let prompts = 0
            while(true) {
                let commandToExecute: string = ""
                let endOfTransmission = false

                stdout.write(Ascii.Codes.NewLine)
                stdout.write(Ascii.stringToCharacterCodes(this.prompt(promptName)))
                if(Layer.active && (prompts++ === 0 || Layer.random() < 0.2)) {
                    Layer.pulse()
                }

                const resultEither = await stdin.consume(async (characterCodes) => {
                    for(let i = 0; i < characterCodes.length; i++) {
                        let characterCode = characterCodes[i]

                        switch(characterCode) {
                            case Ascii.Codes.EndOfTransmission: 
                                endOfTransmission = true
                                return false;
                            case Ascii.Codes.NewLine:
                                // Determine if we are in the middle of a line and emit right arrows if so.
                                // Return false to fall out of consume once a command is written.
                                const rightPad = this.buffer.getLength() - this.buffer.getIndex() 
        
                                stdout.write(Array(rightPad).fill(Ascii.Codes.RightArrow))
                                commandToExecute = this.buffer.getBufferString()
                                this.buffer.reset()
                                return false; // signal to consume to exit 

                            case Ascii.Codes.UpArrow: 
                                const resultEither = this.historyTracker.moveUp()

                                if(Either.isRight(resultEither)) {
                                    const command = Either.getValue(resultEither)

                                    this.replaceCurrentCommand(command, bufferStdin, bufferStdout, stdout)
                                }
                                break; 
                            case Ascii.Codes.DownArrow: 
                                const resultEither2 = this.historyTracker.moveDown()
                                let command2 = Either.isRight(resultEither2) ?
                                    Either.getValue(resultEither2) :
                                    ""
                               
                                this.replaceCurrentCommand(command2, bufferStdin, bufferStdout, stdout)
                                
                                break;
                            case Ascii.Codes.Tab: 
                                const line = this.buffer.getBufferString()
                                const completion = await complete(line, Object.keys(Help.commands), this.filesystem)

                                if(completion.insert !== "") {
                                    // Pretend it is user input
                                    stdin.write(Ascii.stringToCharacterCodes(completion.insert))
                                } else if(completion.candidates.length > 1 && this.buffer.getIndex() === this.buffer.getLength()) {
                                    // Ambiguous: list the matches, then redraw the prompt and the line so far.
                                    stdout.write(Ascii.stringToCharacterCodes(
                                        `\n${completion.candidates.join("  ")}\n${this.prompt(promptName)}${line}`
                                    ))
                                }
                                break;
                            case Ascii.Codes.ClearScreen: 
                                // Do not emit this character, but clear our buffer.
                                // Clear buffer stdout and emit the backspaces 
                                bufferStdout.read()
                                bufferStdin.write(characterCode)
                                await new Promise<void>((resolve) => {
                                    setTimeout(() => {
                                        const responseEither = bufferStdout.read()
            
                                        if(Either.isRight(responseEither)) {
                                            stdout.write(Either.getValue(responseEither))
                                        }

                                        resolve()
                                    }, 1)
                                })
                                break;
                            default: 
                                bufferStdin.write(characterCode)

                                // Wait to see if we get a NACK back, if so do not write to stdout. 
                                await new Promise<void>((resolve) => {
                                    setTimeout(() => {
                                        const responseEither = bufferStdout.read()
            
                                        if(Either.isRight(responseEither)) {
                                            if(!Either.getValue(responseEither).find((x) => x === Ascii.Codes.NACK)) {
                                                stdout.write(characterCode)
                                            }
                                        }

                                        resolve()
                                    }, 1)
                                })
                                break;
                        }
                    }
                })

                if(Either.isLeft(resultEither)) {
                    console.error("mash.ts - Received StreamAlreadyHasListenerError while consuming stream.")
                } else {
                    if(commandToExecute.trim() != "") {
                        stdout.write(Ascii.Codes.NewLine)
                        this.historyTracker.addLine(commandToExecute)
    
                        await this.execute(commandToExecute, stdin, stdout)
                    } else if(endOfTransmission) {
                        stdout.write(Ascii.stringToCharacterCodes(`\nExiting mash shell '${promptName}'\n`))
                        resolve(0)
                        break;
                    }
                }
            }
        })
    }

    private async execute(string: string, stdin: MashStream<number>, stdout: MashStream<number>) {
        try {
          let result = splitPipeline(string).reduce((acc, command) => {
            let tokens = tokenize(command || "")
    
            let cmdEither = Help.getCommand(tokens[0] || "")
            let args = tokens.slice(1)
            let stream = new MashStream<number>()
    
            if(Either.isLeft(cmdEither)) {
              throw new CommandNotFoundError(tokens.length > 0 ? tokens[0] : "")
            }
    
            return {
              run: async () => acc.run().then(async ()=> {
                 await Either.getValue(cmdEither).run(acc.stream, stream, args)
                 stream.write(Ascii.Codes.EndOfTransmission)
              }),
              stream: stream
            }
          }, {stream: stdin, run: () => Promise.resolve()})
    
          result.stream.pipe(stdout)
    
          await result.run()
        } catch(e) {
          if(e instanceof CommandNotFoundError) {
            stdout.write(Ascii.stringToCharacterCodes(e.message))
          } else {
            throw e
          }
        }
      }

    private replaceCurrentCommand(newCommand: string, 
        bufferStdin: MashStream<number>, 
        bufferStdout: MashStream<number>,
        stdout: MashStream<number>) {
        const charactersToWrite: number[] = 
            Array(this.buffer.getLength() - this.buffer.getIndex()).fill(Ascii.Codes.RightArrow)
            .concat(Array(this.buffer.getLength()).fill(Ascii.Codes.Backspace))
            .concat(Ascii.stringToCharacterCodes(newCommand));
        
        // throw away any output from before this series 
        bufferStdout.read()

        bufferStdin.write(charactersToWrite)
        stdout.write(charactersToWrite)
        

    }
    
}

const BANNER = [
    "",
    "[    0.000000] signal recovered on side door",
    "[    0.004113] integrity check ........ 41%",
    `[    0.009771] mounting /home/${Arg.NAME} ... ok`,
    "[    0.012040] warning: name table corrupted",
].join("\n")

class CommandNotFoundError extends Error {
    constructor(
        public command: string) {
      super()
      this.message = `Command '${command}' not found.\n`
    }
  }