import { Graphics, Matrix, ObservablePoint, Point, Transform, type PointData } from 'pixi.js'
import { Component, deltaPos, distanceSquared, invert, normal, Vector, type Range } from '../core'
import { calculateCentroid } from '../geometry'
import type { AABB, Contact } from './types'
import {
  getCircleProjectionRange,
  getClosestVertexToPoint,
  getVerticesProjectionRange,
  hasProjectionOverlap,
  isAABBIntersection,
} from './utils'

export abstract class Collider {
  readonly vertices: Point[]
  readonly normals: Vector[]
  protected transform = new Transform()
  private shouldUpdateVertices = true

  get center(): PointData {
    return this.transform.position.add(this.centroid)
  }
  get position(): PointData {
    return this.transform.position
  }

  protected constructor(
    protected readonly _vertices: Point[],
    protected readonly _normals: Vector[],
    protected readonly centroid: Point,
    public readonly aabb: AABB = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } },
  ) {
    this.vertices = [..._vertices]
    this.normals = [..._normals]

    this.updateVertices()
  }

  static circle(x: number, y: number, r: number) {
    return new CircleCollider(x, y, r)
  }
  static polygon(vertices: number[]) {
    return new PolygonCollider(vertices)
  }
  static rectangle(x: number, y: number, w: number, h: number) {
    return Collider.polygon([x, y, x + w, y, x + w, y + h, x, y + h])
  }

  setTransform(t: Transform) {
    this.shouldUpdateVertices =
      this.transform.position.x != t.position.x ||
      this.transform.position.y != t.position.y ||
      this.transform.rotation != t.rotation

    this.transform.position.set(t.position.x, t.position.y)
    this.transform.rotation = t.rotation
  }

  hasAABBIntersection(B: Collider): boolean {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    return isAABBIntersection(this.aabb, B.aabb)
  }

  getContact(B: Collider): Contact | undefined {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    if (B instanceof CircleCollider) {
      return this.getContactWithCircle(B)
    } else if (B instanceof PolygonCollider) {
      return this.getContactWithPolygon(B)
    }
  }

  abstract getContactWithCircle(B: CircleCollider): Contact | undefined
  abstract getContactWithPolygon(B: PolygonCollider): Contact | undefined

  protected updateVertices() {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this._vertices.length; i++) {
      const v = this.vertices[i]!
      this.transform.matrix.apply(this._vertices[i]!, v)
      this._normals[i]!.rotate(this.transform.rotation, this.normals[i])

      minX = Math.min(minX, v.x)
      maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y)
      maxY = Math.max(maxY, v.y)
    }

    this.aabb.min.x = minX
    this.aabb.min.y = minY
    this.aabb.max.x = maxX
    this.aabb.max.y = maxY
  }

  private updateVerticesIfNeeded() {
    if (this.shouldUpdateVertices) {
      this.updateVertices()
    }
    this.shouldUpdateVertices = false
  }
}

export class CircleCollider extends Collider {
  constructor(
    x: number,
    y: number,
    public radius: number,
  ) {
    super([], [], new Point(x, y), {
      min: { x: x - radius, y: y - radius },
      max: { x: x + radius, y: y + radius },
    })
  }

  getContactWithCircle(B: CircleCollider): Contact | undefined {
    const radii = this.radius + B.radius
    const diffPos = deltaPos(B.center, this.center)
    const distSqrd = diffPos.magnitudeSquared()
    if (distSqrd >= radii * radii) {
      return
    }
    const dist = Math.sqrt(distSqrd)
    return {
      depth: dist - radii,
      normal: diffPos.divideByScalar(dist),
    }
  }

  getContactWithPolygon(B: PolygonCollider): Contact | undefined {
    const contact: Contact = { depth: Infinity, normal: new Vector() }
    let axis!: Vector, cProj!: Range, vProj!: Range

    for (let i = 0; i < B.vertices.length; i++) {
      axis = B.normals[i]!
      vProj = getVerticesProjectionRange(B.vertices, axis)
      cProj = getCircleProjectionRange(this.center, this.radius, axis)
      if (!hasProjectionOverlap(cProj, vProj)) {
        return
      }
      const depth = Math.min(cProj.max - vProj.min, vProj.max - cProj.min)
      if (depth < contact.depth) {
        contact.depth = depth
        contact.normal = axis
      }
    }
    const closestV = getClosestVertexToPoint(B.vertices, this.center)
    axis = normal(closestV, this.center)
    vProj = getVerticesProjectionRange(B.vertices, axis)
    cProj = getCircleProjectionRange(this.center, this.radius, axis)
    if (!hasProjectionOverlap(cProj, vProj)) {
      return
    }
    const depth = Math.min(vProj.max - cProj.min, cProj.max - vProj.min)
    if (depth < contact.depth) {
      contact.depth = depth
      contact.normal = axis
    }
    const dir = deltaPos(B.center, this.center)
    if (dir.dot(contact.normal) < 0) {
      invert(contact.normal)
    }

    return contact
  }

  protected updateVertices(): void {
    this.aabb.min.x = this.position.x - this.radius
    this.aabb.min.y = this.position.y - this.radius
    this.aabb.max.x = this.position.x + this.radius
    this.aabb.max.y = this.position.y + this.radius
  }

  private getPolygonPenetration(
    polygon: PolygonCollider,
  ): { value: number; faceIndex: number } | undefined {
    const pen = { value: -Infinity, faceIndex: -1 }
    // const tC = this.centroid.add(this.transform.position)
    const tV = new Point()
    for (let i = 0; i < polygon.vertices.length; i++) {
      const axis = polygon.normals[i]!.orthogonalize()

      // if (penAtV > this.radius) {
      //   return
      // }
      // if (penAtV > pen.value) {
      //   pen.value = penAtV - this.radius
      //   pen.faceIndex = i
      // }
    }
    return pen
  }
}

export class PolygonCollider extends Collider {
  constructor(vertices: number[]) {
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
    super(_vertices, normals, calculateCentroid(vertices))
  }

  getContactWithCircle(B: CircleCollider): Contact | undefined {
    return B.getContactWithPolygon(this)
  }

  getContactWithPolygon(B: PolygonCollider): Contact | undefined {
    const A = this
    const penAB = PolygonCollider.getPenetration(A, B)
    const penBA = PolygonCollider.getPenetration(B, A)
    if (!penAB || !penBA) {
      return
    }
    // type Contact = { refFace: Vector[]; incFace: Vector[]; penetration: number }
    // let contact: Contact
    // if (penAB > penBA) {
    //   contact = {
    //     refFace: A.getFaceAtIndex(penAB.faceIndex),
    //     incFace: B.getFaceAtIndex(penBA.faceIndex),
    //     penetration: penAB.value,
    //   }
    // } else {
    //   contact = {
    //     refFace: B.getFaceAtIndex(penBA.faceIndex),
    //     incFace: A.getFaceAtIndex(penAB.faceIndex),
    //     penetration: penBA.value,
    //   }
    // }
    // const refFaceN = new Vector(contact.refFace.y, -contact.refFace.x).normalize()
  }

  getRotatedNormal(index: number, output?: Vector) {
    return this.normals[index]!.rotate(this.transform.rotation, output)
  }
  getTransformedVertex(index: number, output?: Point) {
    return this.transform.matrix.apply(this.vertices[index]!, output)
  }
  getFaceAtIndex(index: number): { edges: [Vector, Vector]; delta: Vector } {
    const edges: [Vector, Vector] = [
      this.vertices[index]!,
      this.vertices[(index + 1) % this.vertices.length]!,
    ]
    return { edges, delta: edges[1].subtract(edges[0]) }
  }

  private static getPenetration(
    A: PolygonCollider,
    B: PolygonCollider,
  ): { value: number; faceIndex: number } | undefined {
    const maxProjDist = { value: -Infinity, faceIndex: -1 }
    let N = new Vector()
    let tVProj = new Point()
    let tV = new Point()

    for (let i = 0; i < A.vertices.length; i++) {
      A.getRotatedNormal(i, N)
      // Invert Normal to get the max. projection inwards
      B.getTransformedVertex(B.getVertexIndexWithMaxProjection(N.multiplyScalar(-1)), tVProj)
      A.getTransformedVertex(i, tV)
      const projDist = N.dot(tVProj.subtract(tV))
      if (projDist > maxProjDist.value) {
        maxProjDist.value = projDist
        maxProjDist.faceIndex = i
      }
    }
    // Distances were projected inwards, therefore we exclude positive or 0 valued ones
    // only negatives account as penetration
    if (maxProjDist.value < 0) {
      return maxProjDist
    }
  }

  private getVertexIndexWithMaxProjection(axis: Vector): number {
    let maxProj = -Infinity
    let index = -1
    let tV = new Point()

    for (let i = 0; i < this.vertices.length; i++) {
      this.getTransformedVertex(i, tV)
      const proj = tV.dot(axis)
      if (proj > maxProj) {
        maxProj = proj
        index = i
      }
    }
    return index
  }
}

/*  
    "Any other shape" is limited to convex polygons.  
  */
// testForCollisionWithAnyOtherShape(other: _ColliderShape): CollisionResult | undefined {
//   return
// const cAB = testForCollisionWithVertices(this.vs, other.vs)
// const cBA = testForCollisionWithVertices(other.vs, this.vs)
// if (!cAB || !cBA) {
//   return undefined
// }
// let minOverlap: CollisionResult
// let bA: _ColliderShape, bB: _ColliderShape
// if (cAB.penetration >= cBA.penetration * 0.95 + cAB.penetration * 0.1) {
//   console.log('here')
//   minOverlap = cAB
//   bA = this
//   bB = other
// } else {
//   minOverlap = cBA
//   bA = other
//   bB = this
//   minOverlap.normal = minOverlap.normal.multiplyScalar(-1)
// }
// let incFaceIndex = -1
// let minDot = Infinity
// for (let j = 0; j < bB.vs.length; j += 2) {
//   const normBj = getProjectionAxis(bB.vs, j)
//   const dot = minOverlap.normal.dot(normBj)
//   if (dot < minDot) {
//     minDot = dot
//     incFaceIndex = j
//   }
// }
// const refFace = getFaceAtIndex(bA.vs, minOverlap.faceIndex)
// const refPlaneNormal = getProjectionAxis(bA.vs, minOverlap.faceIndex)
// return minOverlap
//   }

//   updateVertices(pos: PointData, rot: number): void {
//     let minX = Infinity
//     let maxX = -Infinity
//     let minY = Infinity
//     let maxY = -Infinity

//     for (let i = 0; i < this.points.length; i += 2) {
//       const cos = Math.cos(rot)
//       const sin = Math.sin(rot)
//       const px = this.points[i]!
//       const py = this.points[i + 1]!

//       // Rotation matrix: https://en.wikipedia.org/wiki/Rotation_matrix
//       this.vs[i] = px * cos - py * sin + pos.x
//       this.vs[i + 1] = px * sin + py * cos + pos.y
//       minX = Math.min(minX, this.vs[i]!)
//       maxX = Math.max(maxX, this.vs[i]!)
//       minY = Math.min(minY, this.vs[i + 1]!)
//       maxY = Math.max(maxY, this.vs[i + 1]!)

//       this.aabb[0] = minX
//       this.aabb[1] = minY
//       this.aabb[2] = maxX
//       this.aabb[3] = maxY
//     }
//   }

//   _draw(g: Graphics) {
//     g.poly(this.vs)
//   }
// }

// export class RectangleColliderShape extends _ColliderShape {
//   constructor(
//     private x: number,
//     private y: number,
//     public w: number,
//     public h: number,
//   ) {
//     super([x, y, x + w, y, x + w, y + h, x, y + h])
//   }

//   updateVertices(pos: PointData, rot: number): void {
//     if (rot != 0) {
//       super.updateVertices(pos, rot)
//     } else {
//       this.aabb[0] = this.x + pos.x
//       this.aabb[1] = this.y + pos.y
//       this.aabb[2] = this.aabb[0] + this.w
//       this.aabb[3] = this.aabb[1] + this.h

//       this.vs[0] = this.aabb[0]
//       this.vs[1] = this.aabb[1]
//       this.vs[2] = this.aabb[2]
//       this.vs[3] = this.aabb[1]
//       this.vs[4] = this.aabb[2]
//       this.vs[5] = this.aabb[3]
//       this.vs[6] = this.aabb[0]
//       this.vs[7] = this.aabb[3]
//     }
//   }

//   testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
//     // if (this.isRotated || rectangle.isRotated) {
//     return this.testForCollisionWithAnyOtherShape(rectangle)
//     // } else {
//     //   return testForAABBWithDiagonalVertices(this.aabb, rectangle.aabb)
//     // }
//   }
//   testForCollisionWithCircle(circle: _CircleColliderShape): CollisionResult | undefined {
//     return circle.testForCollisionWithAnyOtherShape(this)
//   }
// }

// export class _CircleColliderShape extends _ColliderShape {
//   constructor(
//     private x: number,
//     private y: number,
//     public r: number,
//   ) {
//     super([x, y])
//   }

//   updateVertices(pos: PointData, rot: number): void {
//     this.vs[0] = pos.x + this.points[0]!
//     this.vs[1] = pos.y + this.points[1]!

//     this.aabb[0] = this.x + pos.x - this.r
//     this.aabb[1] = this.y + pos.y - this.r
//     this.aabb[2] = this.aabb[0] + 2 * this.r
//     this.aabb[3] = this.aabb[1] + 2 * this.r
//   }

//   testForCollisionWithRectangle(rectangle: RectangleColliderShape): CollisionResult | undefined {
//     return this.testForCollisionWithAnyOtherShape(rectangle)
//   }
//   testForCollisionWithCircle(circle: _CircleColliderShape): CollisionResult | undefined {
//     const deltaPos = new Vector(this.vs[0]! - circle.vs[0]!, this.vs[1]! - circle.vs[1]!)
//     if (deltaPos.magnitudeSquared() < Math.pow(this.r + circle.r, 2)) {
//       return {
//         penetration: this.r + circle.r - deltaPos.magnitude(),
//         normal: new Vector(circle.x - this.x, circle.y - this.y),
//         faceIndex: -1, // TODO what value to use, or where to move the property to?
//       }
//     }
//   }
//   testForCollisionWithAnyOtherShape(other: _ColliderShape): CollisionResult | undefined {
//     return
// const cAxis = this.getAxisAtClosestVertex(other.vertices)
// const cPR = getCircleProjectionRange(
//   this._pos.x + this.cX,
//   this._pos.y + this.cY,
//   this.r,
//   cAxis,
// )
// const oPR = getPolygonProjectionRange(other.vertices, cAxis)
// if (cPR.min <= oPR.max && oPR.min <= cPR.max) {
// return testForCollisionWithRangeProvider(other.vs, (axis) =>
//   getCircleProjectionRange(this.vs[0]!, this.vs[1]!, this.r, axis),
// )
// }
// }

// _draw(g: Graphics) {
//   g.circle(this.x + this.vs[0]!, this.y + this.vs[1]!, this.r)
// }

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
// }
