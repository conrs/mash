/**
 * Streams assume one producer and one consumer currently.
 *
 * They do not rely on promises/asyncronicity for per-character emission since it tended to be
 * too slow (all the streams in aggregate would show visible delay in outputting text)
 *
 * Instead, users can "read()" (which might return empty array) or "wait()" which will resolve
 * when the stream has content to read (and also since its deferred to next tick, allows for
 * content written at the same "time" to pile up)
 */

 export class Stream<T> {
  private buffer: T[] = []
  private listener: {resolve: () => any, reject: () => any} = undefined

  constructor() {
  }

  hasListener(): boolean {
    return this.listener !== undefined
  }

  write(x: T | T[]) {
    x = Array.isArray(x) ? x : [x]

    this.buffer = this.buffer.concat(x)

    if(this.listener) {
      let resolver = this.listener.resolve
      this.listener = undefined
      resolver()
    }
  }

  read(): T[] {
    if(this.listener) {
      throw new Error("whoa there - one read or listen at a time dawg")
    }

    let b = this.buffer
    this.buffer = []

    return b
  }

  wait(): Promise<void> {
    if(this.listener) {
      throw new Error("more than one thing is waiting on this stream")
    }
    return new Promise((resolve, reject) => {
      let b = this.read()

      this.listener = {
        resolve: resolve,
        reject: reject
      }

      if(b.length > 0) {
        // write it back so the next call to read will get it
        this.write(b)
      }
    })
  }

  async flush() {
    let emptyTicks = 0
    const tickTarget = 5

    await new Promise((resolve) => {
      let interval = setInterval(() => {
        let data = this.read()
        if(data.length > 0)
          emptyTicks = 0
        else
          emptyTicks++

        if(emptyTicks >= tickTarget) {
          clearInterval(interval)
          resolve()
        }
      }, 1)
    })
  }

  async consume(handler: (v: T[]) => boolean | void, id: string = "none") {
    let shouldKeepGoing: boolean = true
    while(shouldKeepGoing) {
      await this.wait()
      shouldKeepGoing = handler(this.read()) !== false
    }
  }

  /**
   * Split will split the current stream into n streams. Is handy for cases
   * where you wish to close a stream or run multiple commands on the same stream.
   *
   * @param n Number of streams to create
   */
  split(n: number = 2): Stream<T>[] {
    let streams = [...Array(n).keys()].map(() => new Stream<T>())

    this.consume((data) => streams.forEach((stream) => stream.write(data)))

    return streams
  }

  pipe(otherStream: Stream<T>) {
    this.consume((data) => otherStream.write(data))
  }

  filter(f: (x: T) => boolean): Stream<T> {
    let newStream = new Stream<T>()
    this.consume((data) => {
      newStream.write(data.filter(f))
    })

    return newStream
  }
 }
