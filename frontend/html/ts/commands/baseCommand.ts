import Stream from "../util/stream"

export abstract class BaseCommand {
  abstract name: string
  abstract helpText: string
  constructor(
    protected stdin: Stream<number>,
    protected stdout: Stream<number>
  )
    {}

  abstract async run(args?: string[]): Promise<number>
}