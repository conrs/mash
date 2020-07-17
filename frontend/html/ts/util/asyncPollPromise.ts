/**
 * Keeps executing an asyncronous call until either the promise rejects, 
 * or the callback returns something truthy.
 * 
 * @param asyncFunc 
 * @param callback 
 */
export async function consumeRepeatedly<T>(
  asyncFunc: () => Promise<T>,
  callback: (e: T) => boolean
): Promise<void> {
  try {
    let result = await asyncFunc()
    let shouldStop = callback(result);
    
    if(!shouldStop) {
      return await consumeRepeatedly(asyncFunc, callback)
    }
  } catch {
    // The promise finally rejected, so we are done.
  }
}
 