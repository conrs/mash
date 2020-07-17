export class Ascii {
  static Codes = {
    LeftArrow: 75,
    RightArrow: 77
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