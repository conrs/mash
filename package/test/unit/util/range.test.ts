import { range } from "../../../src/util/range"

describe("range", () => {
  it("generates numbers between two valid numbers", () => {
    expect(range(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
  it("is ok with same number in both pos", () => {
    expect(range(0, 0)).toEqual([0])
  })

  it("doesn't do any funny business with backwards nums", () => {
    expect.assertions(1);

    try {
      range(10, 0)
    } catch (e) {
      expect(e.message).toBe("invalid range: 10 to 0")
    }
  })

  it("handles neg to pos ranges", () => {
    expect(range(-3, 3)).toEqual([-3, -2, -1, 0, 1, 2, 3])
  })
})