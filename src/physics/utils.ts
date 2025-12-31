import type { Point, PointData } from 'pixi.js'
import { Body } from '../components'
import { Vector, type Range, type Entity } from '../core'
import type { Contact, AABB } from './types'

export function isAABBIntersection(a: AABB, b: AABB): boolean {
  return !(a.max.x < b.min.x || a.max.y < b.min.y || b.max.x < a.min.x || b.max.y < a.min.y)
}

export function hasProjectionOverlap(a: Range, b: Range): boolean {
  return !(a.max <= b.min || b.max <= a.min)
}

export function getClosestVertexToPoint(vertices: Point[], p: PointData): Point {
  let index = -1
  let distSqrd = Infinity
  for (let i = 0; i < vertices.length; i++) {
    const dSq = vertices[i]!.subtract(p).magnitudeSquared()
    if (dSq < distSqrd) {
      distSqrd = dSq
      index = i
    }
  }
  return vertices[index]!
}

export function getVerticesProjectionRange(vertices: PointData[], axis: Vector): Range {
  const range: Range = { min: Infinity, max: -Infinity }
  let proj: number

  for (let i = 0; i < vertices.length; i++) {
    proj = vertices[i]!.x * axis.x + vertices[i]!.y * axis.y
    range.min = Math.min(range.min, proj)
    range.max = Math.max(range.max, proj)
  }
  return range
}

export function getCircleProjectionRange(position: PointData, radius: number, axis: Vector): Range {
  const dot = axis.x * position.x + axis.y * position.y
  const proj: [number, number] = [dot - radius, dot + radius]

  return proj[0] < proj[1] ? { min: proj[0], max: proj[1] } : { min: proj[1], max: proj[0] }
}

export function testForCollision(A: Body, B: Body): Contact | undefined {
  // const contact = A.shape.testForContact(B.shape)
  // if (!contact) {
  //   return
  // }
  return
}

// export function detectCollisions(
//   e_bodies: { e: Entity; c: Body }[],
//   layerMap?: CollisionLayerMap,
// ): Collision[] {
//   let collisions: Collision[] = []

//   for (let i = 0; i < e_bodies.length; i++) {
//     const { e: eA, c: A } = e_bodies[i]!

//     for (let j = i + 1; j < e_bodies.length; j++) {
//       const { e: eB, c: B } = e_bodies[j]!

//       A.shape.updateVertices(A.position, A.rotation)
//       B.shape.updateVertices(B.position, B.rotation)

//       const areMeantToCollide =
//         !layerMap ||
//         (A.layer ? (layerMap.get(A.layer) ?? 0) && B.layer : true) ||
//         (B.layer ? (layerMap.get(B.layer) ?? 0) && A.layer : true)

//       if (!areMeantToCollide) {
//         continue
//       }
//       const col = A.shape.testForCollision(B.shape)
//       if (!col) {
//         continue
//       }
//       // collisions.push({
//       //   actors: [
//       //     { id: eA.id, tag: eA.tag, isSensor: false },
//       //     { id: eB.id, tag: eB.tag, isSensor: false },
//       //   ],
//       //   ...col,
//       // })
//     }
//   }
//   return collisions
// }

/* 
  v0: velocity before collision
  m: mass
  e: coefficient of restitution; https://en.wikipedia.org/wiki/Coefficient_of_restitution
  n: normal of collision
  ---
  Sources:
  - https://timallanwheeler.com/blog/2024/08/01/2d-collision-detection-and-resolution/
  - https://perso.liris.cnrs.fr/nicolas.pronost/UUCourses/GamePhysics/lectures/lecture%207%20Collision%20Resolution.pdf 
*/
export function calculateVelocitiesAfterCollision(
  v0A: Vector,
  v0B: Vector,
  // TODO find collision point, calculate rotation 'radius' and use to apply and return angular velocity
  // w0A: Vector,
  // w0B: Vector,
  // rA: Vector,
  // rB: Vector,
  mA: number,
  mB: number,
  eA: number,
  eB: number,
  n: Vector,
): { a: Vector; b: Vector } | undefined {
  // const relV =
  const v0DiffByN = v0B.subtract(v0A).multiply(n)
  const sumInvMass = 1 / mA + 1 / mB
  const e = (eA + eB) / 2
  // J: impulse (change in momentum); https://en.wikipedia.org/wiki/Momentum
  const j = v0DiffByN.multiplyScalar(-(1 + e) / sumInvMass)
  return {
    a: v0A.subtract(j.multiply(n).divideByScalar(mA)),
    b: v0B.add(j.multiply(n).divideByScalar(mB)),
  }
}

/*  
  v0: velocity before collision
  m: mass
  e: coefficient of restitution; https://en.wikipedia.org/wiki/Coefficient_of_restitution
*/
function _calculateVelocitiesAfterCollision(
  v0A: Vector,
  v0B: Vector,
  mA: number,
  mB: number,
  eA: number,
  eB: number,
): Vector {
  const e = (eA + eB) / 2
  return new Vector(
    mA * v0A.x + mB * v0B.x + mB * e * (v0B.x - v0A.x),
    mA * v0A.y + mB * v0B.y + mB * e * (v0B.y - v0A.y),
  ).divideByScalar(mA + mB)
}
