/**
 * Purpose is to buffer both output and input in a stream.
 * 
 * Thus, consuming and writing work on arrays of T, rather than simply T.
 */

import { Stream } from ".";
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
export class BufferedStreamWriter<T> {
  static WRITE_SPEED_MS = 5
  public underlying: Stream<T>

  constructor(stream: Stream<T> = new Stream<T>()) {
    this.underlying = stream;
  }

  private writePromise: Promise<void>

  async write(contents: T[]): Promise<void> {
    if(this.writePromise) {
      this.writePromise = this.writePromise.then(() => this.write(contents))
    } else {
      let _contents = [...contents];
      
      this.writePromise = new Promise((resolve, reject) => {
        let intervalId = setInterval(() => {
          if(_contents.length > 0) {
            this.underlying.write(_contents.shift())
          } else {
            this.writePromise = undefined;
            resolve()
            clearInterval(intervalId)
          }
        }, BufferedStreamWriter.WRITE_SPEED_MS)
      })
    }

    return this.writePromise
  }
}


