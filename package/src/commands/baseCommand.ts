import { Stream } from "../util/stream"

export abstract class BaseCommand {
  abstract name: string
  abstract helpText: string
  constructor(
  )
    {}

  abstract async run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number>
}