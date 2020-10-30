export class Ascii {
  static Codes = {
    StartOfText: 2,
    Bell: 7,
    Backspace: 8,
    Tab: 9,
    NewLine: 10,

    ClearScreen: 12,
    CarriageReturn: 13,
    Cancel: 24,

    // TODO: implement the ansi codes instead
    LeftArrow: 17,
    RightArrow: 18,
    DownArrow: 19,
    UpArrow: 20,

    Delete: 127
  }

  static isVisibleText(code: number): boolean {
    return code == this.Codes.Tab ||
           code == this.Codes.NewLine ||
           code == this.Codes.Backspace ||
           code == this.Codes.Delete ||
          (code >= 32 && code <= 126) // numbers, letters, punctuation, sushis, sashimis
  }

  static fromCharCode(charCode: number): string {
    return String.fromCharCode(charCode)
  }

  static characterCodesToString(characters: number[]): string {
    return characters.map(Ascii.fromCharCode).join("")
  }

  static stringToCharacterCodes(string: string): number[] {
    return string.split("").map((v) => v.charCodeAt(0))
  }
}