import { consumeRepeatedly } from "./consumeRepeatedly"
import { range } from "./range"

type DeferredPromise<T> = {
  resolve: (v: T) => void,
  reject: (reason: any) => void
}

export class Stream<T> {
  closed: boolean = false
  private listeners: DeferredPromise<T>[] = []
  private buffer: T[] = []

  async read(): Promise<T> {
    if(!this.closed)
      return new Promise((resolve, reject) => {
        if(this.buffer.length > 0)
          resolve(this.buffer.shift())
        else 
          this.listeners.push({
            resolve: resolve,
            reject: reject
          })
      })
    else
      throw new Error("Can't listen to a closed stream!")
  }

  write(value: T) {
    if(this.listeners.length > 0)
      this.listeners.shift().resolve(value)
    else
      this.buffer.push(value)
  }

  end() {
    while(this.listeners.length > 0) {
      this.listeners.shift().reject("Stream closed unexpectedly")
    }
    this.closed = true
  }

  hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  static writeString(stream: Stream<number>, string: string) {
    for(let i = 0; i < string.length; i++) {
      stream.write(string.charCodeAt(i))
    }
  }

  static split<T>(stream: Stream<T>, branching: number = 2, propogateCloses: boolean = false): Stream<T>[] {
    let streams = range(0, branching).map(() => new Stream<T>())

    consumeRepeatedly(stream, (char) => {
      streams = streams.filter((x) => !x.closed)
      if(streams.length > 0) {
        streams.forEach((s) => s.write(char))
      } else {
        // nobody was listening anymore, so write the char back
        stream.write(char)
      }
      return streams.length > 0
    }).catch(() => {
      if(propogateCloses) {
        streams.forEach((stream) => stream.end())
      }
    })

    return streams;
  }

  static pipe<T>(stream1: Stream<T>, stream2: Stream<T> = new Stream<T>(), propogateCloses: boolean = false): Stream<T> {
    consumeRepeatedly(stream1, (x: T) => {
      if(!stream2.closed)
        stream2.write(x)
      else
        stream1.write(x)

      return !stream2.closed;
    }).catch(() => {
      if(propogateCloses) {
        stream2.end()
      }
    })

    return stream2
  }
}