import { Ascii } from "../util/ascii";
import { Either } from "../util/either";
import { Stream } from "../util/stream";
import { Command } from "./baseCommand";

export default class Buffer extends Command {
    command: string = "buffer";
    helpText: string = "Editable buffer of text"

    private index: number = 0
    private buffer: number[] = []

    run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
        return new Promise(async (resolve, _) => {
            const resultEither = await stdin.consume((characterCodes) => {
              for(let i = 0; i < characterCodes.length; i++) {
                let characterCode = characterCodes[i]
      
                switch(characterCode) {
                    case Ascii.Codes.ClearScreen: 
                        stdout.write(this.buffer.fill(Ascii.Codes.Backspace))
                        this.reset()
                        break; 
                    case Ascii.Codes.StartOfText: 
                        this.reset()
                        stdout.write(Ascii.Codes.StartOfText)
                        break;
                    case Ascii.Codes.Backspace: 
                        if(this.index > 0 && this.index === this.buffer.length) {
                            this.buffer.pop()
                            this.index--;
                            
                            stdout.write(Ascii.Codes.LeftArrow)

                            stdout.write(Ascii.Codes.Backspace)
                        } else if(this.index !== 0) {
                            let pendingCharacters = this.buffer.slice(this.index)
                            this.buffer = this.buffer.slice(0, this.index - 1)

                            // Move cursor first 
                            stdout.write(Ascii.Codes.LeftArrow)
                            
                            this.index--;

                            // Emit backspaces for all pending characters
                            stdout.write(pendingCharacters.map((x) => Ascii.Codes.Backspace))

                            // Write the backspace
                            stdout.write(Ascii.Codes.Backspace)

                            // Replay all pending characters
                            pendingCharacters.forEach((pendingCharacter) => {
                                this.buffer.push(pendingCharacter) 
                                stdout.write(pendingCharacter)
                            })
                        } else {
                            stdout.write(Ascii.Codes.NACK)
                        }
                        break;
                    case Ascii.Codes.Delete:
                        if(this.index === this.buffer.length) {
                            stdout.write(Ascii.Codes.NACK)
                        } else if(this.buffer.length > 0) {
                            let pendingCharacters = this.buffer.slice(this.index)
                            this.buffer = this.buffer.slice(0, this.index)

                            // Emit deletions for all pending characters
                            stdout.write(pendingCharacters.map((x) => Ascii.Codes.Backspace))

                            // Replay all pending characters except the first one
                            pendingCharacters.slice(1).forEach((pendingCharacter) => {
                                this.buffer.push(pendingCharacter) 
                                stdout.write(pendingCharacter)
                            })

                            // Update index 
                            this.index--;
                        } 
                        break;
                    case Ascii.Codes.LeftArrow:
                        if(this.index > 0) {
                            this.index--;
                            stdout.write(Ascii.Codes.LeftArrow)
                        } else {
                            stdout.write(Ascii.Codes.NACK)
                        }
                        break; 
                    case Ascii.Codes.RightArrow: 
                        if(this.index < this.buffer.length) {
                            this.index++; 
                            stdout.write(Ascii.Codes.RightArrow)
                        } else {
                            stdout.write(Ascii.Codes.NACK)
                        }
                        break;
                    default: 
                        if(Ascii.isVisibleText(characterCode)) {
                            if(this.index === this.buffer.length) {
                                this.buffer.push(characterCode) 
                                
                                stdout.write(Ascii.Codes.RightArrow)

                                stdout.write(characterCode)
                            } else {
                                let pendingCharacters = this.buffer.slice(this.index)
                                this.buffer = this.buffer.slice(0, this.index)
    
                                // Emit deletions for all pending characters
                                stdout.write(pendingCharacters.map((x) => Ascii.Codes.Backspace))
    
                                // Emit character 
                                stdout.write(Ascii.Codes.RightArrow)

                                stdout.write(characterCode)
                                this.buffer.push(characterCode)
    
                                // Replay all pending characters
                                pendingCharacters.forEach((pendingCharacter) => {
                                    this.buffer.push(pendingCharacter) 
                                    stdout.write(pendingCharacter)
                                })
                            }

                            this.index++;
                        }
                       
                        break;
                    }
                }
            })

            if(Either.isLeft(resultEither)) {
                console.error("Buffer.ts - Received StreamAlreadyHasListenerError while consuming stream.")
            }
        })
    }

    /**
     * I think signalling then reading from the buffer is a little annoying, please forgive me this 
     * shortcut
     * 
     * @returns buffer as string
     */
    getBufferString(): string {
        return Ascii.characterCodesToString([...this.buffer].splice(0, this.index))
    }
    
    getIndex(): number {
        return this.index
    }

    getLength(): number {
        return this.buffer.length
    }

    reset() {
        this.index = 0
        this.buffer = []
    }

}

