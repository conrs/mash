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

export default class Mash extends Command {
    private buffer: MashBuffer = new MashBuffer()
    private historyTracker = new HistoryTracker()
    private promptName = "mash"
    private filesystem = new GithubBlogFilesystem()
    
    command: string = "mash"
    helpText: string = "command interpreter - you can be a troll and keep nesting these, currently no way to kill"
    
    prompt = () => `${this.promptName}:/${this.filesystem.pwd.join("/")} $ `

    constructor(
    ) {
        super()

        Help.register(new Ls(this.filesystem))
        Help.register(new Cat(this.filesystem))
        Help.register(new Cd(this.filesystem))
        Help.register(new Rotate())
        Help.register(new Md2Html())
        Help.register(new Help())
    }

    run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
        if(args && args.length === 1) {
            this.promptName = args[1]
        }
        const bufferStdin: MashStream<number> = new MashStream<number>()
        const bufferStdout: MashStream<number> = new MashStream<number>()
        
        this.buffer.run(bufferStdin, bufferStdout)

        return new Promise(async (resolve, _) => {
            while(true) {
                let commandToExecute: string = ""

                stdout.write(Ascii.Codes.NewLine)
                stdout.write(Ascii.stringToCharacterCodes(this.prompt()))

                const resultEither = await stdin.consume(async (characterCodes) => {
                    for(let i = 0; i < characterCodes.length; i++) {
                        let characterCode = characterCodes[i]

                        switch(characterCode) {
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
                                let nodeEither = await this.filesystem.getCurrentDir()

                                if(Either.isRight(nodeEither)) {
                                    const node = Either.getValue(nodeEither)
                                    let currentCommand = this.buffer.getBufferString()
                                        .split(" ")
                                        .pop()!
                                
                                    const children = await node.children()

                                    const match = Object.keys(children).find((x: string) => {
                                        return x.indexOf(currentCommand) === 0
                                    })

                                    if(match) {
                                        // Pretend it is user input
                                        stdin.write(Ascii.stringToCharacterCodes(match.substring(currentCommand.length)))
                                    }
                                } else {
                                    console.error("unable to handle tab - silently failing")
                                }
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
                    stdout.write(Ascii.Codes.NewLine)
                    this.historyTracker.addLine(commandToExecute)
                    console.log(`cmd: '${commandToExecute}'`)

                    await this.execute(commandToExecute, stdin, stdout)
                }
            }
        })
    }

    private async execute(string: string, stdin: MashStream<number>, stdout: MashStream<number>) {
        try {
          let result = string.split("|").reduce((acc, command) => {
            console.log(`command is ${command}`)
            let tokens = (command || "").split(" ").filter((x) => x != "")
    
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

class HistoryTracker {
    private history: string[] = []
    private index: number = 1
    
    // Up is actually the last line in here, so we read the value then move up if possible. 
    // If there is no up, we need to remember, as the next call to this should fail. 
    moveUp(): Either<NoHistoryError, string> {
      if(this.index > 0) {
        return Right(this.history[--this.index])
      } else {
        return Left(new NoHistoryError())
      }
    }
  
    moveDown(): Either<NoHistoryError, string> {
        if(this.index < this.history.length - 1) {
            return Right(this.history[++this.index])            
        } else {
            if(this.index == this.history.length - 1) {
                // Act like it is a new command
                this.index++;
                return Right("")
            }
            return Left(new NoHistoryError())
        }
    }
  
    addLine(line: string) {
        this.history.push(line)
        this.index++;
    }
  }

class NoHistoryError extends Error {}
class CommandNotFoundError extends Error {
    constructor(
        public command: string) {
      super()
      this.message = `Command '${command}' not found.\n`
    }
  }