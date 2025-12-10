export class Screen {
  private constructor() {}

  static _w = 0
  static get width(): number {
    return Screen._w
  }

  static _h = 0
  static get height(): number {
    return Screen._h
  }
}
