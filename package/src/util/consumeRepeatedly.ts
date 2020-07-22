import { Stream } from "./stream";

/**
 * Keeps executing an asyncronous call until either the promise rejects, 
 * or the callback returns false.
 * 
 * @param asyncFunc 
 * @param callback 
 */
export async function consumeRepeatedly<T>(
  stream: Stream<T>,
  callback: (e: T) => boolean
): Promise<void> {
  try {
    return stream.read().then((val) => {
      let shouldContinue = callback(val);
    
      if(shouldContinue) {
        return consumeRepeatedly(stream, callback)
      }
    })
  } catch (e) {
    // The promise finally rejected, so we are done.
  }
}
 