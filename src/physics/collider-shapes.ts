import { Graphics, Matrix, ObservablePoint, Point, Transform, type PointData } from 'pixi.js'
import { Component, distanceSquared, Vector, type Range } from '../core'
import {
  calculateCentroid,
  getCircleProjectionRange,
  getFaceAtIndex,
  getPolygonProjectionRange,
  getProjectionAxis,
  testForAABBWithDiagonalVertices,
  testForCollisionWithRangeProvider,
  testForCollisionWithVertices,
  type CollisionResult,
  type ShapeContact,
} from '../geometry'

export abstract class _ColliderShape {
  private static nextId = 0
  readonly centroid: Point
  readonly id: number
  readonly vs: number[] // vertices
  readonly aabb: number[] = Array(4).fill(0)

  protected constructor(protected readonly points: number[]) {
    this.centroid = calculateCentroid(points)
    this.id = ++_ColliderShape.nextId
    this.vs = [...points]
  }

  static circle(x: number, y: number, r: number) {
    return new CircleColliderShape(x, y, r)
  }
  static rectangle(x: number, y: number, w: number, h: number) {
    return new RectangleColliderShape(x, y, w, h)
  }
  static polygon(...points: number[]) {
    return new PolygonColliderShape(points)
  }

  testForCollision<T extends _ColliderShape>(other: T): CollisionResult | undefined {
    // if (!testForAABBWithDiagonalVertices(this.aabb, other.aabb)) {
    //   return undefined
    // }
    if (other instanceof RectangleColliderShape) {
      // return this.testForCollisionWithRectangle(other)
      return this.testForCollisionWithAnyOtherShape(other)
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
  testForCollisionWithAnyOtherShape(other: _ColliderShape): CollisionResult | undefined {
    const cAB = testForCollisionWithVertices(this.vs, other.vs)
    const cBA = testForCollisionWithVertices(other.vs, this.vs)
    if (!cAB || !cBA) {
      return undefined
    }
    let minOverlap: CollisionResult
    let bA: _ColliderShape, bB: _ColliderShape
    if (cAB.penetration >= cBA.penetration * 0.95 + cAB.penetration * 0.1) {
      console.log('here')
      minOverlap = cAB
      bA = this
      bB = other
    } else {
      minOverlap = cBA
      bA = other
      bB = this
      minOverlap.normal = minOverlap.normal.multiplyScalar(-1)
    }
    let incFaceIndex = -1
    let minDot = Infinity
    for (let j = 0; j < bB.vs.length; j += 2) {
      const normBj = getProjectionAxis(bB.vs, j)
      const dot = minOverlap.normal.dot(normBj)
      if (dot < minDot) {
        minDot = dot
        incFaceIndex = j
      }
    }
    const refFace = getFaceAtIndex(bA.vs, minOverlap.faceIndex)
    const refPlaneNormal = getProjectionAxis(bA.vs, minOverlap.faceIndex)

    return minOverlap
  }

  updateVertices(pos: PointData, rot: number): void {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this.points.length; i += 2) {
      const cos = Math.cos(rot)
      const sin = Math.sin(rot)
      const px = this.points[i]!
      const py = this.points[i + 1]!

      // Rotation matrix: https://en.wikipedia.org/wiki/Rotation_matrix
      this.vs[i] = px * cos - py * sin + pos.x
      this.vs[i + 1] = px * sin + py * cos + pos.y
      minX = Math.min(minX, this.vs[i]!)
      maxX = Math.max(maxX, this.vs[i]!)
      minY = Math.min(minY, this.vs[i + 1]!)
      maxY = Math.max(maxY, this.vs[i + 1]!)

      this.aabb[0] = minX
      this.aabb[1] = minY
      this.aabb[2] = maxX
      this.aabb[3] = maxY
    }
  }

  _draw(g: Graphics) {
    g.poly(this.vs)
  }
}

export class RectangleColliderShape extends _ColliderShape {
  constructor(
    private x: number,
    private y: number,
    public w: number,
    public h: number,
  ) {
    super([x, y, x + w, y, x + w, y + h, x, y + h])
  }

  updateVertices(pos: PointData, rot: number): void {
    if (rot != 0) {
      super.updateVertices(pos, rot)
    } else {
      this.aabb[0] = this.x + pos.x
      this.aabb[1] = this.y + pos.y
      this.aabb[2] = this.aabb[0] + this.w
      this.aabb[3] = this.aabb[1] + this.h

      this.vs[0] = this.aabb[0]
      this.vs[1] = this.aabb[1]
      this.vs[2] = this.aabb[2]
      this.vs[3] = this.aabb[1]
      this.vs[4] = this.aabb[2]
      this.vs[5] = this.aabb[3]
      this.vs[6] = this.aabb[0]
      this.vs[7] = this.aabb[3]
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

export class CircleColliderShape extends _ColliderShape {
  constructor(
    private x: number,
    private y: number,
    public r: number,
  ) {
    super([x, y])
  }

  updateVertices(pos: PointData, rot: number): void {
    this.vs[0] = pos.x + this.points[0]!
    this.vs[1] = pos.y + this.points[1]!

    this.aabb[0] = this.x + pos.x - this.r
    this.aabb[1] = this.y + pos.y - this.r
    this.aabb[2] = this.aabb[0] + 2 * this.r
    this.aabb[3] = this.aabb[1] + 2 * this.r
  }

  testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
    return this.testForCollisionWithAnyOtherShape(rectangle)
  }
  testForCollisionWithCircle(circle: CircleColliderShape): CollisionResult | undefined {
    const deltaPos = new Vector(this.vs[0]! - circle.vs[0]!, this.vs[1]! - circle.vs[1]!)
    if (deltaPos.magnitudeSquared() < Math.pow(this.r + circle.r, 2)) {
      return {
        penetration: this.r + circle.r - deltaPos.magnitude(),
        normal: new Vector(circle.x - this.x, circle.y - this.y),
        faceIndex: -1, // TODO what value to use, or where to move the property to?
      }
    }
  }
  testForCollisionWithAnyOtherShape(other: _ColliderShape): CollisionResult | undefined {
    // const cAxis = this.getAxisAtClosestVertex(other.vertices)
    // const cPR = getCircleProjectionRange(
    //   this._pos.x + this.cX,
    //   this._pos.y + this.cY,
    //   this.r,
    //   cAxis,
    // )
    // const oPR = getPolygonProjectionRange(other.vertices, cAxis)

    // if (cPR.min <= oPR.max && oPR.min <= cPR.max) {
    return testForCollisionWithRangeProvider(other.vs, (axis) =>
      getCircleProjectionRange(this.vs[0]!, this.vs[1]!, this.r, axis),
    )
    // }
  }

  _draw(g: Graphics) {
    g.circle(this.x + this.vs[0]!, this.y + this.vs[1]!, this.r)
  }

  // private getAxisAtClosestVertex(vertices: number[]): Vector {
  //   const v = new Vector()
  //   let dSqrd = -Infinity
  //   let closestIndex = -1
  //   for (let i = 0; i < vertices.length; i += 2) {
  //     v.x = vertices[i]! - this._pos.x
  //     v.y = vertices[i + 1]! - this._pos.y

  //     const mSqrd = v.magnitudeSquared()
  //     if (mSqrd < dSqrd) {
  //       closestIndex = i
  //       dSqrd = mSqrd
  //     }
  //   }
  //   return v.normalize()
  // }
}

export abstract class ColliderShape {
  transform = new Transform()

  protected constructor(
    public readonly vertices: Point[],
    public readonly normals: Vector[],
    public readonly centroid: Point,
  ) {}

  static rectangle(x: number, y: number, w: number, h: number) {
    return ColliderShape.polygon([x, y, x + w, y, x + w, y + h, x, y + h])
  }
  static polygon(vertices: number[]) {
    return new PolygonColliderShape(vertices)
  }

  testForContact(B: ColliderShape) {
    if (B instanceof PolygonColliderShape) {
      return this.testForContactWithPolygon(B)
    }
  }

  abstract testForContactWithPolygon(B: PolygonColliderShape): ShapeContact | undefined
}

export class PolygonColliderShape extends ColliderShape {
  constructor(vertices: number[]) {
    const centroid = calculateCentroid(vertices)
    const _vertices: Point[] = []
    for (let i = 0; i < vertices.length; i += 2) {
      _vertices.push(new Point(vertices[i]!, vertices[i + 1]!))
    }
    const normals: Vector[] = []
    for (let i = 0; i < _vertices.length; i++) {
      const vi = _vertices[i]!
      const vi1 = _vertices[(i + 1) % _vertices.length]!
      const face: Vector = vi1.subtract(vi)
      normals.push(new Vector(face.y, -face.x).normalize()) // => -90º rotation => [0 1; -1 0] x [fX; fY] = [fY;-fX]
    }
    super(_vertices, normals, centroid)
  }

  testForContactWithPolygon(B: PolygonColliderShape): ShapeContact | undefined {
    const A = this
    const penA = PolygonColliderShape.getPenetration(A, B)
    if (!penA) {
      return
    }
    const penB = PolygonColliderShape.getPenetration(B, A)
    if (!penB) {
      return
    }
    console.log(penA, penB)
  }

  private static getPenetration(
    A: PolygonColliderShape,
    B: PolygonColliderShape,
  ): { value: number; faceIndex: number } | undefined {
    const maxDist = { value: -Infinity, faceIndex: -1 }
    let N = new Vector()
    let tVProj = new Point()
    let tV = new Point()

    for (let i = 0; i < A.vertices.length; i++) {
      A.rotateNormal(i, N)
      B.transformVertex(B.getVertexIndexWithMaxProjection(N.multiplyScalar(-1)), tVProj)
      A.transformVertex(i, tV)
      const penDist = N.dot(tVProj.subtract(tV))
      if (penDist > maxDist.value) {
        maxDist.value = penDist
        maxDist.faceIndex = i
      }
    }
    if (maxDist.value < 0) {
      return maxDist
    }
  }

  private getVertexIndexWithMaxProjection(axis: Vector): number {
    let maxProj = -Infinity
    let index = -1
    let tV = new Point()

    for (let i = 0; i < this.vertices.length; i++) {
      this.transformVertex(i, tV)
      const proj = tV.dot(axis)
      if (proj > maxProj) {
        maxProj = proj
        index = i
      }
    }
    return index
  }

  private rotateNormal(index: number, output: Vector) {
    this.normals[index]!.rotate(this.transform.rotation, output)
  }
  private transformVertex(index: number, output: Point) {
    this.transform.matrix.apply(this.vertices[index]!, output)
  }
}
