import { Stream } from "../util/stream"

export abstract class Command {
  command: string
  helpText: string
  
  constructor(
  )
    {}

  abstract async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number>
}