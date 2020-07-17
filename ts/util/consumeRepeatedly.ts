import Stream from "./stream";

/**
 * Keeps executing an asyncronous call until either the promise rejects, 
 * or the callback returns something truthy.
 * 
 * @param asyncFunc 
 * @param callback 
 */
export async function consumeRepeatedly<T>(
  stream: Stream<T>,
  callback: (e: T) => boolean
): Promise<void> {
  try {
    let result = await stream.read()
    let shouldStop = callback(result);
    
    if(!shouldStop) {
      return await consumeRepeatedly(stream, callback)
    }
  } catch {
    // The promise finally rejected, so we are done.
  }
}
 