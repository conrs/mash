import { BaseCommand } from "./baseCommand";
import * as util from "../util";
import { Buffer } from "./buffer"}

/**
 * What's my architecture again?
 * 
 * 
 * Streams of numbers. 
 * 
 * Ok, great. So then commands have to be dynamically passed these streams of numbers. 
 * So they can't be in the constructors. They must always be in "run". 
 * 
 * So that's done. Now what's a shell?
 * A shell is a prompt then a buffer in an infinite loop. 
 */
export class Mash extends BaseCommand {
  name = "mash";
  helpText = "shell which interprets commands -- reads until newline unless escaped"
  private commands: {
    [index: string]: BaseCommand
  }

  private commandBuffer: string = ""
  private bufferedStdout: util.BufferedStreamWriter<number>
  static PROMPT = "mash $"

  constructor(commands: BaseCommand[]) {
    super()
    this.commands = {}

    commands.forEach((command) => this.commands[command.name] = command)
  }

  async run(stdin: util.Stream<number>, stdout: util.Stream<number>, args?: string[]): Promise<number> {
    this.bufferedStdout = new util.BufferedStreamWriter(stdout)

    while(true) {
      this.bufferedStdout.write(util.Ascii.stringToCharacterCodes(Mash.PROMPT))
      let bufferedStdin = new util.Stream<number>()

      let buffer = Buffer.run(stdin, bufferedStdin)
      
    }
    await util.consumeRepeatedly(stdin, async (char) => {
      this.commandBuffer += util.Ascii.characterCodesToString([char])
      if(char == util.Ascii.Codes.NewLine) {
        await this.execute(this.commandBuffer)
        this.commandBuffer = ""
      }
      return true;
    });

    return 0;
  }

  private async execute(command: string) {
    let tokens = command.split(" ")

    if(!this.commands[tokens[0]]) {
      await this.bufferedStdout.write(util.Ascii.stringToCharacterCodes(`Command '${tokens[0]}' not found.`))
    } else {

    }
  }
  
}