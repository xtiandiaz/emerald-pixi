import { Point, Rectangle, type PointData } from 'pixi.js'
import 'pixi.js/math-extras'

declare module 'pixi.js' {
  interface Rectangle {
    size(): Point
    center(): Point
  }
}

Rectangle.prototype.size = function (this): Point {
  return new Point(this.width, this.height)
}

Rectangle.prototype.center = function (this): Point {
  return new Point(this.x + this.width / 2, this.y + this.height / 2)
}

declare global {
  interface Vector2Math {
    divide<T extends PointData>(other: T, outVector?: T): T
    divideScalar<T extends PointData>(scalar: number, outVector?: T): T
  }
}

Point.prototype.divide = function <T extends PointData>(this, other: T, outVector?: T): T {
  if (!outVector) {
    outVector = new Point() as PointData as T
  }
  outVector.x = this.x / other.x
  outVector.y = this.y / other.y

  return outVector
}

Point.prototype.divideScalar = function <T extends PointData>(
  this,
  scalar: number,
  outVector?: T,
): T {
  if (!outVector) {
    outVector = new Point() as PointData as T
  }
  outVector.x = this.x / scalar
  outVector.y = this.y / scalar

  return outVector
}
