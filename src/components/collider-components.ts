import { Point, type PointData } from 'pixi.js'
import { Component, distanceSquared, testForAABBV } from '../core'

export abstract class CollisionShape {
  readonly vertices: number[]
  readonly aabb: number[] = Array(4).fill(0)
  readonly center = new Point()

  constructor(
    public x: number,
    public y: number,
    protected points: number[],
  ) {
    this.vertices = [...points]

    this.update({ x: 0, y: 0 }, 0)
  }

  update(wPos: PointData, rot: number): void {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this.points.length; i++) {
      const cos = Math.cos(rot)
      const sin = Math.sin(rot)

      if (i % 2 == 0) {
        const x = this.points[i]! + this.x
        const y = this.points[i + 1]! + this.y
        this.vertices[i] = x * cos - y * sin + wPos.x
        minX = Math.min(minX, this.vertices[i]!)
        maxX = Math.max(maxX, this.vertices[i]!)
      } else {
        const x = this.points[i - 1]! + this.x
        const y = this.points[i]! + this.y
        this.vertices[i] = x * sin + y * cos + wPos.y
        minY = Math.min(minY, this.vertices[i]!)
        maxY = Math.max(maxY, this.vertices[i]!)
      }
      this.aabb[0] = minX
      this.aabb[1] = minY
      this.aabb[2] = maxX
      this.aabb[3] = maxY
      // console.log(this.aabb)
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
}

export class RectangleCS extends CollisionShape {
  constructor(
    x: number,
    y: number,
    public w: number,
    public h: number,
  ) {
    super(x, y, [0, 0, w, 0, w, h, 0, h])
  }

  update(wPos: PointData, rot: number): void {
    if (rot != 0) {
      super.update(wPos, rot)
    } else {
      this.aabb[0] = this.x + wPos.x
      this.aabb[1] = this.y + wPos.y
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

      this.center.set(this.aabb[0] + this.w * 0.5, this.aabb[1] + this.h * 0.5)
    }
  }

  collidesRectangle(rectangle: RectangleCS): boolean {
    return testForAABBV(this.aabb, rectangle.aabb)
  }
  collidesCircle(circle: CircleCS): boolean {
    return testForAABBV(this.aabb, circle.aabb) // TODO
  }
}

export class CircleCS extends CollisionShape {
  constructor(
    x: number,
    y: number,
    public r: number,
  ) {
    super(x, y, [])
  }

  update(wPos: PointData, _: number): void {
    this.aabb[0] = this.x + wPos.x - this.r
    this.aabb[1] = this.y + wPos.y - this.r
    this.aabb[2] = this.aabb[0] + 2 * this.r
    this.aabb[3] = this.aabb[1] + 2 * this.r

    this.center.set(this.x + wPos.x, this.y + wPos.y)
  }

  collidesRectangle(rectangle: RectangleCS): boolean {
    return testForAABBV(this.aabb, rectangle.aabb)
  }
  collidesCircle(circle: CircleCS): boolean {
    return distanceSquared(this.center, circle.center) < Math.pow(this.r + circle.r, 2)
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
    this.shape.update(worldPos, rotation)
  }

  collides<T extends CollisionShape>(other: Collider<T>): boolean {
    return this.shape.collides(other.shape)
  }
}
