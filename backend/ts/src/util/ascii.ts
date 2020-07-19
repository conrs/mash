export class Ascii {
  static Codes = {
    Bell: 7,

    LeftArrow: 8,
    RightArrow: 9,
    DownArrow: 11,
    UpArrow: 13, // We're co-opting a ascii code here we don't plan to use. 

    ClearScreen: 12,

    NewLine: 10
  }

  static isPrintableCharacterCode(code: number): boolean {
    return code == 10 ||
    (code >= 32 && code <= 126)
  }

  static getPrintableCharacter(code: number): string | undefined {
    if(Ascii.isPrintableCharacterCode(code)) {
      return String.fromCharCode(code)
    } 
  }
}