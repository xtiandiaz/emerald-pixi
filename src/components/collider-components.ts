import { Graphics, type PointData } from 'pixi.js'
import { Component, distanceSquared, testForAABBV, Vector, type Range } from '../core'

export interface Collision {
  direction: Vector
  distance: number
}

export abstract class CollisionShape {
  readonly position = new Vector()
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

  testCollision<T extends CollisionShape>(other: T): Collision | undefined {
    if (other instanceof RectangleCS) {
      return this.testRectangleCollision(other)
    } else if (other instanceof CircleCS) {
      return this.testCircleCollision(other)
    } else if (other instanceof PolygonCS) {
      return this.testShapeCollision(other)
    } else {
      console.error('Not implemented!')
    }
  }
  abstract testRectangleCollision(rectangle: RectangleCS): Collision | undefined
  abstract testCircleCollision(circle: CircleCS): Collision | undefined

  testShapeCollision(other: CollisionShape): Collision | undefined {
    const pColAB = this.testPossibleCollisionWithVertices(this.vertices, other.vertices)
    let pColBA: Collision | undefined
    if (pColAB) {
      pColBA = this.testPossibleCollisionWithVertices(other.vertices, this.vertices)
    }
    if (pColAB && pColBA) {
      return pColAB.distance < pColBA.distance ? pColAB : pColBA
    }
  }

  createDebugGraphics(): Graphics {
    return new Graphics().poly(this.points).stroke({ width: 1, color: 0x00ffff })
  }

  /* 
    Following SAT – Separating Axis Theorem: https://www.sevenson.com.au/programming/sat/ 
  */
  protected testPossibleCollisionWithVertices(
    verticesA: number[],
    verticesB: number[],
  ): Collision | undefined {
    return this.testPossibleCollisionWithRangeProvider(verticesA, (axis) =>
      this.getProjectionRange(verticesB, axis),
    )
  }
  protected testPossibleCollisionWithRangeProvider(
    verticesA: number[],
    getRangeB: (axis: Vector) => Range,
  ): Collision | undefined {
    const col: Collision = {
      direction: new Vector(),
      distance: Infinity,
    }
    for (let i = 0; i < verticesA.length; i += 2) {
      const axis = this.getProjectionAxis(verticesA, i)
      const pRangeA = this.getProjectionRange(verticesA, axis)
      const pRangeB = getRangeB(axis)

      if (pRangeB.max < pRangeA.min || pRangeA.max < pRangeB.min) {
        return undefined
      }
      const pDist = Math.abs(pRangeB.max - pRangeA.min)
      if (pDist < col.distance) {
        col.distance = pDist
        col.direction = axis.multiplyScalar(-1)
      }
    }
    return col
  }

  protected getProjectionRange(vertices: number[], axisNorm: Vector): Range {
    const range = { min: Infinity, max: -Infinity }
    let proj: number
    for (let j = 0; j < vertices.length; j += 2) {
      proj = vertices[j]! * axisNorm.x + vertices[j + 1]! * axisNorm.y
      range.min = Math.min(range.min, proj)
      range.max = Math.max(range.max, proj)
    }
    return range
  }

  private getProjectionAxis(vertices: number[], i: number): Vector {
    return new Vector(
      vertices[(i + 3) % vertices.length]! - vertices[i + 1]!,
      vertices[i]! - vertices[(i + 2) % vertices.length]!,
    ).normalize()
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

  testRectangleCollision(rectangle: RectangleCS): Collision | undefined {
    if (this.isRotated || rectangle.isRotated) {
      return this.testShapeCollision(rectangle)
    } /*  else {
      return testForAABBV(this.aabb, rectangle.aabb)
    } */
  }
  testCircleCollision(circle: CircleCS): Collision | undefined {
    return circle.testShapeCollision(this)
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

  testRectangleCollision(rectangle: RectangleCS): Collision | undefined {
    return this.testShapeCollision(rectangle)
  }
  testCircleCollision(circle: CircleCS): Collision | undefined {
    if (distanceSquared(this.position, circle.position) < Math.pow(this.r + circle.r, 2)) {
      return {
        distance: this.r + circle.r,
        direction: new Vector(circle.x - this.x, circle.y - this.y),
      }
    }
    return undefined
  }
  testShapeCollision(other: CollisionShape): Collision | undefined {
    const cAxis = this.getAxisAtClosestVertex(other.vertices)
    const cPR = this.getSingleProjectionRange(cAxis)
    const oPR = this.getProjectionRange(other.vertices, cAxis)

    if (cPR.min <= oPR.max && oPR.min <= cPR.max) {
      return this.testPossibleCollisionWithRangeProvider(other.vertices, (axis) =>
        this.getSingleProjectionRange(axis),
      )
    }
  }

  createDebugGraphics(): Graphics {
    return new Graphics().circle(this.x, this.y, this.r).stroke({ width: 1, color: 0x00ffff })
  }

  private getAxisAtClosestVertex(vertices: number[]): Vector {
    const v = new Vector()
    let dSqrd = -Infinity
    let closestIndex = -1
    for (let i = 0; i < vertices.length; i += 2) {
      v.x = vertices[i]! - this.position.x
      v.y = vertices[i + 1]! - this.position.y

      const mSqrd = v.magnitudeSquared()
      if (mSqrd < dSqrd) {
        closestIndex = i
        dSqrd = mSqrd
      }
    }
    return v.normalize()
  }

  private getSingleProjectionRange(axis: Vector): Range {
    const dot = axis.x * this.position.x + axis.y * this.position.y

    return { min: dot - this.r, max: dot + this.r }
  }
}

export class PolygonCS extends CollisionShape {
  testRectangleCollision(rectangle: RectangleCS): Collision | undefined {
    return this.testShapeCollision(rectangle)
  }
  testCircleCollision(circle: CircleCS): Collision | undefined {
    return circle.testShapeCollision(this)
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
  static polygon(...points: number[]) {
    return new Collider(new PolygonCS(points))
  }

  update(worldPos: PointData, rotation: number): void {
    this.shape.position.copyFrom(worldPos)
    this.shape.rotation = rotation

    this.shape.update()
  }

  getCollision<T extends CollisionShape>(other: Collider<T>): Collision | undefined {
    if (testForAABBV(this.aabb, other.aabb)) {
      return this.shape.testCollision(other.shape)
    }
  }
}
