import { Collider, Body } from '../components'
import { Vector, type Entity } from '../core'
import type { Collision, CollisionLayerMap } from './types'

export function detectCollisions(
  e_bodies: { e: Entity; c: Body }[],
  layerMap?: CollisionLayerMap,
): Collision[] {
  let collisions: Collision[] = []

  for (let i = 0; i < e_bodies.length; i++) {
    const { e: eA, c: A } = e_bodies[i]!

    for (let j = i + 1; j < e_bodies.length; j++) {
      const { e: eB, c: B } = e_bodies[j]!

      A.shape.updateVertices(A.position, A.rotation)
      B.shape.updateVertices(B.position, B.rotation)

      const areMeantToCollide =
        !layerMap ||
        (A.layer ? (layerMap.get(A.layer) ?? 0) && B.layer : true) ||
        (B.layer ? (layerMap.get(B.layer) ?? 0) && A.layer : true)

      if (!areMeantToCollide) {
        continue
      }
      const col = A.shape.testForCollision(B.shape)
      if (!col) {
        continue
      }
      collisions.push({
        actors: [
          { id: eA.id, tag: eA.tag, isSensor: false },
          { id: eB.id, tag: eB.tag, isSensor: false },
        ],
        ...col,
      })
    }
  }
  return collisions
}

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
