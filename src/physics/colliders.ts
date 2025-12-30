import { Graphics, Matrix, ObservablePoint, Point, Transform, type PointData } from 'pixi.js'
import { Component, distanceSquared, Vector, type Range } from '../core'
import { calculateCentroid } from '../geometry'
import type { Contact } from './types'

export abstract class Collider {
  transform = new Transform()

  protected constructor(
    public readonly vertices: Point[],
    public readonly normals: Vector[],
    public readonly centroid: Point,
  ) {}

  static circle(x: number, y: number, r: number) {
    return new CircleCollider(x, y, r)
  }
  static polygon(vertices: number[]) {
    return new PolygonCollider(vertices)
  }
  static rectangle(x: number, y: number, w: number, h: number) {
    return Collider.polygon([x, y, x + w, y, x + w, y + h, x, y + h])
  }

  testForContact(B: Collider): Contact | undefined {
    if (B instanceof CircleCollider) {
      return this.testForContactWithCircle(B)
    } else if (B instanceof PolygonCollider) {
      return this.testForContactWithPolygon(B)
    }
  }

  abstract testForContactWithCircle(B: CircleCollider): Contact | undefined
  abstract testForContactWithPolygon(B: PolygonCollider): Contact | undefined
}

export class CircleCollider extends Collider {
  constructor(
    x: number,
    y: number,
    public radius: number,
  ) {
    super([], [], new Point(x, y))
  }

  testForContactWithCircle(B: CircleCollider): Contact | undefined {
    const sumOfRadii = this.radius + B.radius
    const tPosA = this.centroid.add(this.transform.position)
    const diffPos = B.centroid.add(B.transform.position).subtract(tPosA)
    const distSqrd = diffPos.magnitudeSquared()
    if (distSqrd > sumOfRadii * sumOfRadii) {
      return
    }
    const dist = Math.sqrt(distSqrd)
    if (dist == 0) {
      return {
        penetration: this.radius,
        normal: new Vector(1, 0),
        points: [tPosA],
      }
    }
    const N = diffPos.divideByScalar(dist)
    return {
      penetration: dist - sumOfRadii,
      normal: N,
      points: [tPosA.add(N.multiplyScalar(this.radius))],
    }
  }

  testForContactWithPolygon(B: PolygonCollider): Contact | undefined {
    const pen = this.getPolygonPenetration(B)
    if (!pen) {
      return
    }
    const incFace = B.getTransformedFaceAtIndex(pen.faceIndex)
    const tC = this.centroid.add(this.transform.position)
    // console.log('tC', tC, incFace)
    const dots: [number, number] = [
      tC.subtract(incFace[0]).dot(incFace[1].subtract(incFace[0])),
      tC.subtract(incFace[1]).dot(incFace[0].subtract(incFace[1])),
    ]
    // console.log(dots)
    let N: Vector, contactPoint: Point
    if (dots[0] <= 0) {
      // Closer to face's origin
      if (distanceSquared(tC, incFace[0]) > this.radius * this.radius) {
        return
      }
      N = incFace[0].subtract(tC).normalize()
      contactPoint = incFace[0]
    } else if (dots[1] <= 0) {
      // Closer to face's end
      if (distanceSquared(tC, incFace[1]) > this.radius * this.radius) {
        return
      }
      N = incFace[1].subtract(tC).normalize()
      contactPoint = incFace[1]
      console.log(contactPoint, N)
    } else {
      // Closer to another point along the face
      N = B.getRotatedNormal(pen.faceIndex).multiplyScalar(-1)
      contactPoint = tC.add(N.multiplyScalar(this.radius + pen.value))
    }
    return {
      penetration: pen.value,
      normal: N,
      points: [contactPoint],
    }
  }

  private getPolygonPenetration(
    polygon: PolygonCollider,
  ): { value: number; faceIndex: number } | undefined {
    const pen = { value: -Infinity, faceIndex: -1 }
    const tC = this.centroid.add(this.transform.position)
    const N = new Vector()
    const tV = new Point()
    for (let i = 0; i < polygon.vertices.length; i++) {
      polygon.getRotatedNormal(i, N)
      polygon.getTransformedVertex(i, tV)
      const penAtV = N.dot(tC.subtract(tV))
      if (penAtV > this.radius) {
        return
      }
      if (penAtV > pen.value) {
        pen.value = penAtV - this.radius
        pen.faceIndex = i
      }
    }
    return pen
  }
}

export class PolygonCollider extends Collider {
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

  testForContactWithCircle(B: CircleCollider): Contact | undefined {
    const contact = B.testForContactWithPolygon(this)
    if (contact) {
      contact.normal.multiplyScalar(-1, contact.normal)
    }
    return contact
  }

  testForContactWithPolygon(B: PolygonCollider): Contact | undefined {
    const A = this
    const penAB = PolygonCollider.getPenetration(A, B)
    const penBA = PolygonCollider.getPenetration(B, A)
    if (!penAB || !penBA) {
      return
    }
    type Contact = { refFace: Vector[]; incFace: Vector[]; penetration: number }
    let contact: Contact
    if (penAB > penBA) {
      contact = {
        refFace: A.getTransformedFaceAtIndex(penAB.faceIndex),
        incFace: B.getTransformedFaceAtIndex(penBA.faceIndex),
        penetration: penAB.value,
      }
    } else {
      contact = {
        refFace: B.getTransformedFaceAtIndex(penBA.faceIndex),
        incFace: A.getTransformedFaceAtIndex(penAB.faceIndex),
        penetration: penBA.value,
      }
    }
    // const refFaceN = new Vector(contact.refFace.y, -contact.refFace.x).normalize()
  }

  getRotatedNormal(index: number, output?: Vector) {
    return this.normals[index]!.rotate(this.transform.rotation, output)
  }
  getTransformedVertex(index: number, output?: Point) {
    return this.transform.matrix.apply(this.vertices[index]!, output)
  }
  getTransformedFaceAtIndex(index: number): [Vector, Vector] {
    return [
      this.getTransformedVertex(index),
      this.getTransformedVertex((index + 1) % this.vertices.length),
    ]
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
