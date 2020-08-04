import { Stream } from "../util/stream"

export abstract class BaseCommand {
  static command: string
  static helpText: string
  constructor(
  )
    {}

  abstract async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number>
}