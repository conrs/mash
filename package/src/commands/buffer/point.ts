export class Point {
  constructor(
    public x: number,
    public y: number
  ) {
    if(x < 0 || y < 0 || !Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Invalid point (${x}, ${y}) -- must be positive integers.`)
    }
  }
}