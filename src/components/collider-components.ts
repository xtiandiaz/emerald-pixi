import { Graphics, Point, type PointData } from 'pixi.js'
import { Component, distanceSquared, Vector, type Range } from '../core'
import {
  getCircleProjectionRange,
  getPolygonProjectionRange,
  testForAABBWithDiagonalVertices,
  testForCollisionWithRangeProvider,
  testForCollisionWithVertices,
  type CollisionResult,
} from '../collision'

export abstract class ColliderShape {
  readonly vertices: number[]
  readonly aabb: number[] = Array(4).fill(0)

  protected readonly _pos = new Point()

  protected _rot = 0
  protected isRotated = false
  get rotation(): number {
    return this._rot
  }
  set rotation(val: number) {
    this._rot = val
    this.isRotated = val != 0
    this.shouldUpdateVertices = true
  }
  private shouldUpdateVertices = true

  protected constructor(protected readonly points: number[]) {
    this.vertices = [...points]
  }

  static rectangle(cX: number, cY: number, w: number, h: number) {
    return new RectangleColliderShape(cX, cY, w, h)
  }
  static circle(cX: number, cY: number, r: number) {
    return new CircleColliderShape(cX, cY, r)
  }
  static polygon(...points: number[]) {
    return new PolygonColliderShape(points)
  }

  setPosition(x: number, y: number) {
    this._pos.set(x, y)
    this.shouldUpdateVertices = true
  }

  testForCollision<T extends ColliderShape>(other: T): CollisionResult | undefined {
    if (this.shouldUpdateVertices) {
      this.updateVertices()
    }
    if (other.shouldUpdateVertices) {
      other.updateVertices()
    }
    if (!testForAABBWithDiagonalVertices(this.aabb, other.aabb)) {
      return undefined
    }
    if (other instanceof RectangleColliderShape) {
      return this.testForCollisionWithRectangle(other)
    } else if (other instanceof CircleColliderShape) {
      return this.testForCollisionWithCircle(other)
    } else if (other instanceof PolygonColliderShape) {
      return this.testForCollisionWithAnyOtherShape(other)
    } else {
      console.error('Not implemented!')
    }
  }
  abstract testForCollisionWithRectangle(
    rectangle: RectangleColliderShape,
  ): CollisionResult | undefined
  abstract testForCollisionWithCircle(circle: CircleColliderShape): CollisionResult | undefined

  /*  
    "Any other shape" is limited to convex polygons.  
  */
  testForCollisionWithAnyOtherShape(other: ColliderShape): CollisionResult | undefined {
    const cAB = testForCollisionWithVertices(this.vertices, other.vertices)
    if (!cAB) {
      return undefined
    }
    const cBA = testForCollisionWithVertices(other.vertices, this.vertices)
    if (!cBA) {
      return undefined
    }
    return cAB.penetration < cBA.penetration ? cAB : cBA
  }

  createDebugGraphics(): Graphics {
    return new Graphics().poly(this.points).stroke({ width: 1, color: 0x00ffff })
  }

  protected updateVertices(): void {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this.points.length; i += 2) {
      const cos = Math.cos(this._rot)
      const sin = Math.sin(this._rot)
      const x = this.points[i]!
      const y = this.points[i + 1]!

      // Rotation matrix: https://en.wikipedia.org/wiki/Rotation_matrix
      this.vertices[i] = x * cos - y * sin + this._pos.x
      this.vertices[i + 1] = x * sin + y * cos + this._pos.y
      minX = Math.min(minX, this.vertices[i]!)
      maxX = Math.max(maxX, this.vertices[i]!)
      minY = Math.min(minY, this.vertices[i + 1]!)
      maxY = Math.max(maxY, this.vertices[i + 1]!)

      this.aabb[0] = minX
      this.aabb[1] = minY
      this.aabb[2] = maxX
      this.aabb[3] = maxY
    }
    this.shouldUpdateVertices = false
  }
}

export class RectangleColliderShape extends ColliderShape {
  constructor(
    private cX: number,
    private cY: number,
    public w: number,
    public h: number,
  ) {
    super([cX, cY, cX + w, cY, cX + w, cY + h, cX, cY + h])
  }

  updateVertices(): void {
    if (this._rot != 0) {
      super.updateVertices()
    } else {
      this.aabb[0] = this.cX + this._pos.x
      this.aabb[1] = this.cY + this._pos.y
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

  testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
    // if (this.isRotated || rectangle.isRotated) {
    return this.testForCollisionWithAnyOtherShape(rectangle)
    // } else {
    //   return testForAABBWithDiagonalVertices(this.aabb, rectangle.aabb)
    // }
  }
  testForCollisionWithCircle(circle: CircleColliderShape): CollisionResult | undefined {
    return circle.testForCollisionWithAnyOtherShape(this)
  }
}

export class CircleColliderShape extends ColliderShape {
  constructor(
    private cX: number,
    private cY: number,
    public r: number,
  ) {
    super([])
  }

  updateVertices(): void {
    this.aabb[0] = this.cX + this._pos.x - this.r
    this.aabb[1] = this.cY + this._pos.y - this.r
    this.aabb[2] = this.aabb[0] + 2 * this.r
    this.aabb[3] = this.aabb[1] + 2 * this.r
  }

  testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
    return this.testForCollisionWithAnyOtherShape(rectangle)
  }
  testForCollisionWithCircle(circle: CircleColliderShape): CollisionResult | undefined {
    if (distanceSquared(this._pos, circle._pos) < Math.pow(this.r + circle.r, 2)) {
      return {
        penetration: this.r + circle.r - circle._pos.subtract(this._pos).magnitude(),
        dir: new Vector(circle.cX - this.cX, circle.cY - this.cY),
      }
    }
  }
  testForCollisionWithAnyOtherShape(other: ColliderShape): CollisionResult | undefined {
    const cAxis = this.getAxisAtClosestVertex(other.vertices)
    const cPR = getCircleProjectionRange(
      this._pos.x + this.cX,
      this._pos.y + this.cY,
      this.r,
      cAxis,
    )
    const oPR = getPolygonProjectionRange(other.vertices, cAxis)

    if (cPR.min <= oPR.max && oPR.min <= cPR.max) {
      return testForCollisionWithRangeProvider(other.vertices, (axis) =>
        getCircleProjectionRange(this._pos.x + this.cX, this._pos.y + this.cY, this.r, axis),
      )
    }
  }

  createDebugGraphics(): Graphics {
    return new Graphics().circle(this.cX, this.cY, this.r).stroke({ width: 1, color: 0x00ffff })
  }

  private getAxisAtClosestVertex(vertices: number[]): Vector {
    const v = new Vector()
    let dSqrd = -Infinity
    let closestIndex = -1
    for (let i = 0; i < vertices.length; i += 2) {
      v.x = vertices[i]! - this._pos.x
      v.y = vertices[i + 1]! - this._pos.y

      const mSqrd = v.magnitudeSquared()
      if (mSqrd < dSqrd) {
        closestIndex = i
        dSqrd = mSqrd
      }
    }
    return v.normalize()
  }
}

export class PolygonColliderShape extends ColliderShape {
  testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
    return this.testForCollisionWithAnyOtherShape(rectangle)
  }
  testForCollisionWithCircle(circle: CircleColliderShape): CollisionResult | undefined {
    return circle.testForCollisionWithAnyOtherShape(this)
  }
}

export class Collider<Shape extends ColliderShape> extends Component {
  constructor(
    protected shape: Shape,
    public layer: number,
  ) {
    super()
  }

  updateShapeTransform(x: number, y: number, rotation: number) {
    this.shape.setPosition(x, y)
    this.shape.rotation = rotation
  }

  testForCollision<T extends ColliderShape>(other: Collider<T>): CollisionResult | undefined {
    return this.shape.testForCollision(other.shape)
  }

  createDebugGraphics(): Graphics {
    return this.shape.createDebugGraphics()
  }
}
