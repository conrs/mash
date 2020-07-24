/**
 * Purpose is to buffer both output and input in a stream.
 * 
 * Thus, consuming and writing work on arrays of T, rather than simply T.
 */

import { Stream, Ascii } from ".";
import { consumeRepeatedly } from "./consumeRepeatedly";

export class BufferedStreamReader<T> {
  public underlying: Stream<T>

  private readBuffer: T[] = []


  constructor(stream: Stream<T> = new Stream<T>()) {
    this.underlying = stream;

    consumeRepeatedly(stream, (c) => {
      this.readBuffer.push(c)

      return true;
    })
  }

  read(): T[] {
    let result = this.readBuffer

    this.readBuffer = []

    return result
  }
}

type Work<T> = {
  resolveFunc: () => any,
  buffer: T[],
}

export class BufferedStreamWriter<T> {
  static WRITE_SPEED_MS = 1
  public underlying: Stream<T>

  constructor(stream: Stream<T> = new Stream<T>()) {
    this.underlying = stream;
  }

  private workQueue: Work<T>[] = []
  private timeoutId: NodeJS.Timeout

  async write(contents: T[] | T, itsMyTurn: boolean = false): Promise<void> {
    let promise = new Promise<void>((resolve) => {
      this.workQueue.push({
        resolveFunc: resolve,
        buffer: contents instanceof Array ? [...contents] : [contents]
      })

      if(!this.timeoutId) {
        this.writeFunc()
      }
    })

    return promise;
  }

  private writeFunc() {
    if(this.workQueue.length > 0) {
      let head = this.workQueue[0]

      let character = head.buffer.shift()

      this.underlying.write(character)

      if(head.buffer.length == 0) {
        head.resolveFunc()
        this.workQueue.shift()
      }

      this.timeoutId = setTimeout(this.writeFunc.bind(this), BufferedStreamWriter.WRITE_SPEED_MS)
    } else {
      this.timeoutId = undefined;
    }
  }

  async clearBuffer() {
    if(this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined;
    }
    this.workQueue = []
  }
}


