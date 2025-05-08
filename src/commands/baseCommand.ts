import { Stream } from "../util/stream"

export abstract class Command {
  abstract command: string
  abstract helpText: string

  abstract run(stdin: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number>
}