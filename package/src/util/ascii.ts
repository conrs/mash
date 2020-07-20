export class Ascii {
  static Codes = {
    Bell: 7,

    // TODO: implement the ansi codes instead
    LeftArrow: 17,
    RightArrow: 18,
    DownArrow: 19,
    UpArrow: 20,

    ClearScreen: 12,

    NewLine: 10
  }

  static isPrintableCharacterCode(code: number): boolean {
    return code == 10 ||  // space
           code == 9 ||   // tab 
          (code >= 32 && code <= 126) // numbers, letters, punctuation, sushis, sashimis
  }

  static getPrintableCharacter(code: number): string | undefined {
    if(Ascii.isPrintableCharacterCode(code)) {
      return String.fromCharCode(code)
    } 
  }
}