export function fold<T,U>(collection: T[], initialValue: U, f: (acc: U, x: T) => U): U {
  if(collection.length == 0) {
    return initialValue
  } else {
    return fold(collection.slice(1), f(initialValue, collection[0]), f)
  }
}
