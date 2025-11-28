export default class ScreenComponent {
  static _width = 0
  static get width(): number {
    return ScreenComponent._width
  }

  static _height = 0
  static get height(): number {
    return ScreenComponent._height
  }
}
