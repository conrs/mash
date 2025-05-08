import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Ascii } from "../util/ascii";
import { Stream } from "../util/stream";
import { Either, Left, Right } from "../util/either";

export class Help extends Command {
  command: string = "help"
  helpText: string = "list commands"
  static commands: {[command: string]: Command} = {}


  static register(command: Command) {
    this.commands[command.command.split(" ")[0]] = command
  } 

  static getCommand(command: string): Either<CommandNotFoundError, Command> {
    if(this.commands[command.split(" ")[0]]) {
        return Right(this.commands[command.split(" ")[0]])
    } else {
        return Left(new CommandNotFoundError())
    }
  }

  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    stdout.write(Ascii.stringToCharacterCodes(
        Object.keys(Help.commands).reduce((acc, command) => {
            return acc + "\n" + command + "\t\t" + Help.commands[command].helpText
        }, "")
    ))

    return 1
  }
}

class CommandNotFoundError extends Error {}