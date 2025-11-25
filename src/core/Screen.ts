import { Vector2 } from './'

export default class Screen {
  static __size: Vector2 = new Vector2()

  static get size(): Vector2 {
    return Screen.__size
  }

  static get width(): number {
    return Screen.size.x
  }

  static get height(): number {
    return Screen.size.y
  }
}
