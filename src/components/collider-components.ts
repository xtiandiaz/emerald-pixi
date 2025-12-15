import { Graphics, Point, type PointData } from 'pixi.js'
import { Component, distanceSquared, testForAABBV, Vector } from '../core'

export abstract class CollisionShape {
  readonly position = new Point()
  readonly vertices: number[]
  readonly aabb: number[] = Array(4).fill(0)

  protected _rotation = 0
  protected isRotated = false
  set rotation(val: number) {
    this._rotation = val
    this.isRotated = val != 0
  }

  constructor(protected readonly points: number[]) {
    this.vertices = [...points]

    this.update()
  }

  update(): void {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this.points.length; i += 2) {
      const cos = Math.cos(this._rotation)
      const sin = Math.sin(this._rotation)
      const x = this.points[i]!
      const y = this.points[i + 1]!

      // Rotation matrix: https://en.wikipedia.org/wiki/Rotation_matrix
      this.vertices[i] = x * cos - y * sin + this.position.x
      this.vertices[i + 1] = x * sin + y * cos + this.position.y
      minX = Math.min(minX, this.vertices[i]!)
      maxX = Math.max(maxX, this.vertices[i]!)
      minY = Math.min(minY, this.vertices[i + 1]!)
      maxY = Math.max(maxY, this.vertices[i + 1]!)

      this.aabb[0] = minX
      this.aabb[1] = minY
      this.aabb[2] = maxX
      this.aabb[3] = maxY
    }
  }

  collides<T extends CollisionShape>(other: T): boolean {
    if (other instanceof RectangleCS) {
      return this.collidesRectangle(other)
    } else if (other instanceof CircleCS) {
      return this.collidesCircle(other)
    } else {
      console.error('Not implemented')
      return false
    }
  }
  abstract collidesRectangle(rectangle: RectangleCS): boolean
  abstract collidesCircle(circle: CircleCS): boolean

  /* 
    Following SAT – Separating Axis Theorem: https://www.sevenson.com.au/programming/sat/ 
  */
  collidesPolygon(polygon: PolygonCS): boolean {
    function overlapsProjection(from: number[], to: number[]) {
      let dot: number, minDotFrom: number, maxDotFrom: number, minDotTo: number, maxDotTo: number
      for (let i = 0; i < from.length; i += 2) {
        const v0 = [from[i]!, from[i + 1]!]
        const v1 = [from[(i + 2) % from.length]!, from[(i + 3) % from.length]!]
        const normal = new Vector(v1[1]! - v0[1]!, v0[0]! - v1[0]!)
        minDotFrom = Infinity
        maxDotFrom = -Infinity
        for (let j = 0; j < from.length; j += 2) {
          dot = normal.dot({ x: from[j]!, y: from[j + 1]! })
          minDotFrom = Math.min(minDotFrom, dot)
          maxDotFrom = Math.max(maxDotFrom, dot)
        }
        minDotTo = Infinity
        maxDotTo = -Infinity
        for (let j = 0; j < to.length; j += 2) {
          dot = normal.dot({ x: to[j]!, y: to[j + 1]! })
          minDotTo = Math.min(minDotTo, dot)
          maxDotTo = Math.max(maxDotTo, dot)
        }
        if (minDotFrom > maxDotTo || minDotTo > maxDotFrom) {
          return false
        }
      }
      return true
    }
    return (
      overlapsProjection(this.vertices, polygon.vertices) &&
      overlapsProjection(polygon.vertices, this.vertices)
    )
  }

  createDebugGraphics(): Graphics {
    return new Graphics().poly(this.points).stroke({ width: 1, color: 0x00ffff })
  }
}

export class RectangleCS extends CollisionShape {
  constructor(
    private x: number,
    private y: number,
    public w: number,
    public h: number,
  ) {
    super([x, y, x + w, y, x + w, y + h, x, y + h])
  }

  update(): void {
    if (this._rotation != 0) {
      super.update()
    } else {
      this.aabb[0] = this.x + this.position.x
      this.aabb[1] = this.y + this.position.y
      this.aabb[2] = this.aabb[0] + this.w
      this.aabb[3] = this.aabb[1] + this.h

      this.vertices[0] = this.aabb[0]
      this.vertices[1] = this.aabb[1]
      this.vertices[2] = this.aabb[2]
      this.vertices[3] = this.aabb[1]
      this.vertices[4] = this.aabb[2]
      this.vertices[5] = this.aabb[3]
      this.vertices[6] = this.aabb[0]
      this.vertices[7] = this.aabb[3]
    }
  }

  collidesRectangle(rectangle: RectangleCS): boolean {
    if (this.isRotated || rectangle.isRotated) {
      return this.collidesPolygon(rectangle as PolygonCS)
    } else {
      return testForAABBV(this.aabb, rectangle.aabb)
    }
  }
  collidesCircle(circle: CircleCS): boolean {
    return testForAABBV(this.aabb, circle.aabb) // TODO
  }
}

export class CircleCS extends CollisionShape {
  constructor(
    private x: number,
    private y: number,
    public r: number,
  ) {
    super([])
  }

  update(): void {
    this.aabb[0] = this.x + this.position.x - this.r
    this.aabb[1] = this.y + this.position.y - this.r
    this.aabb[2] = this.aabb[0] + 2 * this.r
    this.aabb[3] = this.aabb[1] + 2 * this.r
  }

  collidesRectangle(rectangle: RectangleCS): boolean {
    return testForAABBV(this.aabb, rectangle.aabb)
  }
  collidesCircle(circle: CircleCS): boolean {
    return distanceSquared(this.position, circle.position) < Math.pow(this.r + circle.r, 2)
  }
  collidesPolygon(polygon: PolygonCS): boolean {
    return false
  }

  createDebugGraphics(): Graphics {
    return new Graphics().circle(this.x, this.y, this.r).stroke({ width: 1, color: 0x00ffff })
  }
}

export class PolygonCS extends CollisionShape {
  collidesCircle(circle: CircleCS): boolean {
    return false
  }
  collidesRectangle(rectangle: RectangleCS): boolean {
    return false
  }
  collidesPolygon(polygon: PolygonCS): boolean {
    return true
  }
}

export class Collider<Shape extends CollisionShape> extends Component {
  get aabb(): number[] {
    return this.shape.aabb
  }

  constructor(public shape: Shape) {
    super()
  }

  static rectangle(x: number, y: number, w: number, h: number) {
    return new Collider(new RectangleCS(x, y, w, h))
  }
  static circle(x: number, y: number, r: number) {
    return new Collider(new CircleCS(x, y, r))
  }

  update(worldPos: PointData, rotation: number): void {
    this.shape.position.copyFrom(worldPos)
    this.shape.rotation = rotation

    this.shape.update()
  }

  collides<T extends CollisionShape>(other: Collider<T>): boolean {
    return this.shape.collides(other.shape)
  }
}
