export function range(start: number, end: number): number[] {
  if(end < start)
    throw new Error(`invalid range: ${start} to ${end}`)
  return [...Array(end+1-start).keys()].map(i => i + start);
}