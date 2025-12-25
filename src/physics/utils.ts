import { Collider, RigidBody } from '../components'
import { Vector, type Entity } from '../core'
import type { Collision, CollisionLayerMap } from './types'

export function detectCollisions(
  e_cs: { e: Entity; c: Collider<any> }[],
  layerMap?: CollisionLayerMap,
): Collision[] {
  let collisions: Collision[] = []

  for (let i = 0; i < e_cs.length; i++) {
    const { e: eA, c: cA } = e_cs[i]!

    for (let j = i + 1; j < e_cs.length; j++) {
      const { e: eB, c: cB } = e_cs[j]!

      const areMeantToCollide =
        !layerMap ||
        ((layerMap.get(cA.layer) ?? 0) && cB.layer) ||
        ((layerMap.get(cB.layer) ?? 0) && cA.layer)
      if (!areMeantToCollide) {
        continue
      }
      const col = cA.testForCollision(cB)
      if (!col) {
        continue
      }
      const rbA = eA.getComponent(RigidBody)
      const from = rbA && !rbA.isStatic ? eA : eB
      const into = from.id == eA.id ? eB : eA
      collisions.push({
        fromId: from.id,
        intoId: into.id,
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
): { a: Vector; b: Vector } {
  const v0DiffByN = v0A.subtract(v0B).multiply(n)
  const sumOfInvMass = 1 / mA + 1 / mB
  // J: impulse (change in momentum); https://en.wikipedia.org/wiki/Momentum
  const jA = v0DiffByN.multiplyScalar(-(1 + eA) / sumOfInvMass)
  const jB = v0DiffByN.multiplyScalar(-(1 + eB) / sumOfInvMass)
  return {
    a: v0A.add(jA.multiply(n).divideByScalar(mA)),
    b: v0B.subtract(jB.multiply(n).divideByScalar(mB)),
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
): { a: Vector; b: Vector } {
  return {
    a: new Vector(
      mA * v0A.x + mB * v0B.x + mB * eA * (v0B.x - v0A.x),
      mA * v0A.y + mB * v0B.y + mB * eA * (v0B.y - v0A.y),
    ).divideByScalar(mA + mB),
    b: new Vector(
      mA * v0A.x + mB * v0B.x + mA * eB * (v0A.x - v0B.x),
      mA * v0A.y + mB * v0B.y + mA * eB * (v0A.y - v0B.y),
    ).divideByScalar(mA + mB),
  }
}
