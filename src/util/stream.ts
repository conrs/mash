import { Either, Left, Right }  from "./either"

/**
 * Streams accept writes from anyone and reads from a consumer.
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
    private listener: {resolve: (x: Either<StreamAlreadyHasListenerError, void>) => void, reject: () => any} | undefined = undefined
  
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
        resolver(Right())
      }
    }
  
    read(): Either<StreamAlreadyHasListenerError, T[]> {
      if(this.listener) {
        return Left(new StreamAlreadyHasListenerError())
      }
  
      let b = this.buffer
      this.buffer = []
  
      return Right(b)
    }
  
    wait(): Promise<Either<StreamAlreadyHasListenerError, void>> {
      if(this.listener) {
        return Promise.resolve(Left(new StreamAlreadyHasListenerError()))
      }

      return new Promise((resolve, reject) => {
        let readResultEither = this.read()

        if(Either.isRight(readResultEither)) {
            const readResult = Either.getValue(readResultEither)
    
            if(readResult.length > 0) {
                // This will resolve the listener promise and contents will be waiting 
                // for handler to read.
                this.write(readResult)
                resolve(Right()) 
            } else {
                this.listener = {
                    resolve,
                    reject
                }    
            }
        }
      })
    }
  
    async flush() {
      let emptyTicks = 0
      const tickTarget = 5
  
      await new Promise<void>((resolve) => {
        let interval = setInterval(() => {
          let readEither = this.read()

          if(Either.isRight(readEither)) {
            const data = Either.getValue(readEither)

            if(data.length > 0)
                emptyTicks = 0
              else
                emptyTicks++
      
              if(emptyTicks >= tickTarget) {
                clearInterval(interval)
                resolve()
              }
          }
        }, 1)
      })
    }
  
    async consume(handler: (v: T[]) => boolean | void | Promise<boolean|void>, id: string = "none"): Promise<Either<StreamAlreadyHasListenerError, void>> {
      let shouldKeepGoing: boolean = true
      while(shouldKeepGoing) {
        await this.wait()
        const readEither = this.read()

        if(Either.isRight(readEither)) {
            const data = Either.getValue(readEither)

            shouldKeepGoing = (await handler(data)) !== false
        } else {
            // readEither is Left<StreamAlreadyHasListenerError>
            return readEither
        }
      }

      return Right()
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


class StreamAlreadyHasListenerError extends Error {}