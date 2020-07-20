type DeferredPromise<T> = {
  resolve: (v: T) => void,
  reject: (reason: any) => void
}

export class Stream<T> {
  private listeners: DeferredPromise<T>[] = []
  private buffer: T[] = []

  async read(): Promise<T> {
    return new Promise((resolve, reject) => {
      if(this.buffer.length > 0) 
        resolve(this.buffer.shift())
      else 
        this.listeners.push({
          resolve: resolve,
          reject: reject
        })
    })
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
  }

  hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  static writeString(stream: Stream<number>, string: string) {
    for(let i = 0; i < string.length; i++) {
      stream.write(string.charCodeAt(i))
    }
  }
}