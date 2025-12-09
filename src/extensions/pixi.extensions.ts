import { Point, Rectangle, type PointData } from 'pixi.js'
import 'pixi.js/math-extras'
import { clamp } from '../core/utils'

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
    clamp<T extends PointData = Point>(min: PointData, max: PointData, outVector?: T): T
    clampScalar<T extends PointData = Point>(min: number, max: number, outVector?: T): T
    divideBy<T extends PointData = Point>(other: T, outVector?: T): T
    divideByScalar<T extends PointData = Point>(scalar: number, outVector?: T): T
  }
}

Point.prototype.clamp = function <T extends PointData = Point>(
  this,
  min: PointData,
  max: PointData,
  outVector?: T,
): T {
  if (!outVector) {
    outVector = new Point() as PointData as T
  }
  outVector.x = clamp(this.x, min.x, max.x)
  outVector.y = clamp(this.y, min.y, max.y)

  return outVector
}

Point.prototype.clampScalar = function <T extends PointData = Point>(
  this,
  min: number,
  max: number,
  outVector?: T,
): T {
  if (!outVector) {
    outVector = new Point() as PointData as T
  }
  outVector.x = clamp(this.x, min, max)
  outVector.y = clamp(this.y, min, max)

  return outVector
}

Point.prototype.divideBy = function <T extends PointData = Point>(
  this,
  other: T,
  outVector?: T,
): T {
  if (!outVector) {
    outVector = new Point() as PointData as T
  }
  outVector.x = this.x / other.x
  outVector.y = this.y / other.y

  return outVector
}

Point.prototype.divideByScalar = function <T extends PointData = Point>(
  this,
  scalar: number,
  outVector?: T,
): T {
  return this.divideBy(new Point(scalar, scalar) as PointData as T, outVector)
}
