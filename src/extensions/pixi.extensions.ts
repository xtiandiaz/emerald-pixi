import { Rectangle, Point as Vector2, type PointData } from 'pixi.js'
import 'pixi.js/math-extras'

declare module 'pixi.js' {
  interface Rectangle {
    size(): Vector2
  }
}

Rectangle.prototype.size = function (this): Vector2 {
  return new Vector2(this.width, this.height)
}

declare global {
  interface Vector2Math {
    divide<T extends PointData>(other: T, outVector?: T): T
    divideScalar<T extends PointData>(scalar: number, outVector?: T): T
  }
}

Vector2.prototype.divide = function <T extends PointData>(this, other: T, outVector?: T): T {
  if (!outVector) {
    outVector = new Vector2() as PointData as T
  }
  outVector.x = this.x / other.x
  outVector.y = this.y / other.y

  return outVector
}

Vector2.prototype.divideScalar = function <T extends PointData>(
  this,
  scalar: number,
  outVector?: T,
): T {
  if (!outVector) {
    outVector = new Vector2() as PointData as T
  }
  outVector.x = this.x / scalar
  outVector.y = this.y / scalar

  return outVector
}
