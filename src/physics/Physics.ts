import type { Point, PointData } from 'pixi.js'
import { average, CircleCollider, Collision, isNearlyEqual, Vector, type Collider } from '../core'
import { type Body } from '../components'

export namespace Physics {
  export const NEARLY_ZERO_MAGNITUDE = 0.001 // 1 mm

  export interface Gravity {
    vector: Vector
    value: number
  }

  export interface Friction {
    static: number
    dynamic: number
  }

  /* 
    Area Density: https://en.wikipedia.org/wiki/Area_density
  */
  export function calculateMass(area: number, density: number) {
    return area * density
  }
  /* 
    Src: https://www.rose-hulman.edu/ES204/PDFs/Appendix_from_Mechanical_Systems_Book.pdf
    TODO Find out why
  */
  export function calculateColliderInertia(collider: Collider, mass: number) {
    if (collider instanceof CircleCollider) {
      return (mass * Math.pow(collider.radius, 2)) / 2
    } else {
      const w = collider.aabb.max.x - collider.aabb.min.x
      const h = collider.aabb.max.y - collider.aabb.min.y
      const numberOfVertices = collider.vertices.length
      switch (numberOfVertices) {
        case 4:
          return (mass * (Math.pow(w, 2) + Math.pow(h, 2))) / 12
        default:
          throw new Error(
            `Inertia for polygons of ${numberOfVertices} vertices is NOT yet calculated!`,
          )
      }
    }
  }

  // export function stepBody(body: Body, gravity: Gravity, PPM: number, dT: number) {
  //   if (body.isStatic) {
  //     return
  //   }
  //   if (!body.isKinematic) {
  //     // TODO should I multiply forces by inv mass considering that F = m * a ?
  //     const forces = gravity.vector.multiplyScalar(gravity.value)
  //     forces.x += (body.force.x * PPM) / dT
  //     forces.y += (body.force.y * PPM) / dT
  //     body.force.set(0, 0)

  //     body.velocity.x += forces.x * dT
  //     body.velocity.y += forces.y * dT

  //     body.angularVelocity += body.torque * dT
  //     body.torque = 0
  //     body.angularVelocity *= 1 - body.angularDrag
  //   }

  //   // const _prevPosition = body.position.clone()

  //   body.transform.position.x += body.velocity.x * PPM * dT
  //   body.transform.position.y += body.velocity.y * PPM * dT
  //   body.transform.rotation += body.angularVelocity * PPM * dT

  //   // const _prevRotation = body.rotation
  //   // const _nextRotation = body.rotation + body.angularVelocity * PPM * dT
  //   // if (isNearlyEqual(_prevRotation, _nextRotation, 0.01)) {
  //   //   console.log('here')
  //   // }
  //   // {
  //   //   body.transform.rotation = _nextRotation
  //   // }
  // }

  // export function separateBodies(A: Body, B: Body, depth: Vector) {
  //   if (A.isStatic) {
  //     B.transform.position.x += depth.x
  //     B.transform.position.y += depth.y
  //   } else if (B.isStatic) {
  //     A.transform.position.x -= depth.x
  //     A.transform.position.y -= depth.y
  //   } else {
  //     // const sumMasses = A.mass + B.mass
  //     // const massFactorA = A.mass / sumMasses
  //     A.transform.position.x -= depth.x /* * massFactorA */ * 0.5
  //     A.transform.position.y -= depth.y /* * massFactorA */ * 0.5
  //     // const massFactorB = B.mass / sumMasses
  //     B.transform.position.x += depth.x /* * massFactorB */ * 0.5
  //     B.transform.position.y += depth.y /* * massFactorB */ * 0.5
  //   }
  // }

  // interface Resolution {
  //   body: Body
  //   accImpulse: Vector
  //   accAngularImpulse: number
  // }

  // export function resolveCollision(A: Body, B: Body, contact: Collision.Contact) {
  //   if (!contact.points) {
  //     return
  //   }

  //   const zeroVector = new Vector()
  //   const pointCount = contact.points.length
  //   const coeffs = getResolutionCoefficients(A, B)
  //   const sumInvMasses = A.invMass + B.invMass
  //   const rA = new Vector()
  //   const rB = new Vector()
  //   const rAOrth = new Vector()
  //   const rBOrth = new Vector()
  //   // Relative velocity
  //   const vr = new Vector()
  //   const T = new Vector()
  //   const impulse = new Vector()
  //   const frictionalImpulse = new Vector()
  //   // const rAs = new Array(new Vector())
  //   const jrs = new Array<number>(2)

  //   function calculateRotationRadii(collisionPoint: Point) {
  //     collisionPoint.subtract(A.position, rA)
  //     collisionPoint.subtract(B.position, rB)
  //     rA.orthogonalize(rAOrth)
  //     rB.orthogonalize(rBOrth)
  //   }

  //   function calculateRelativeVelocity() {
  //     B.velocity
  //       .add(rBOrth.multiplyScalar(B.angularVelocity), vr)
  //       .subtract(A.velocity, vr)
  //       .subtract(rAOrth.multiplyScalar(A.angularVelocity), vr)
  //   }

  //   const resA: Resolution = {
  //     body: A,
  //     accImpulse: new Vector(),
  //     accAngularImpulse: 0,
  //   }
  //   const resB: Resolution = {
  //     body: B,
  //     accImpulse: new Vector(),
  //     accAngularImpulse: 0,
  //   }

  //   const N = contact.normal

  //   for (let i = 0; i < pointCount; i++) {
  //     calculateRotationRadii(contact.points[i]!)

  //     calculateRelativeVelocity()
  //     const vrDotN = vr.dot(N)
  //     if (vrDotN > 0) {
  //       return
  //     }
  //     // Reaction impulse magnitude (jr)
  //     jrs[i] = -(1 + coeffs.restitution) * vrDotN
  //     const sqrd_rAcrossN_x_invI = Math.pow(rA.cross(N), 2) * A.invInertia
  //     const sqrd_rBcrossN_x_invI = Math.pow(rB.cross(N), 2) * B.invInertia
  //     const massDenom = sumInvMasses + sqrd_rAcrossN_x_invI + sqrd_rBcrossN_x_invI

  //     // Reaction impulse
  //     impulse.add(N.multiplyScalar(jrs[i]! / massDenom / pointCount))
  //     recordImpulse(resA, impulse.multiplyScalar(-1), rA)
  //     recordImpulse(resB, impulse, rB)
  //   }

  //   // applyImpulse(resA)
  //   // applyImpulse(resB)

  //   for (let i = 0; i < pointCount; i++) {
  //     calculateRotationRadii(contact.points[i]!)

  //     calculateRelativeVelocity()
  //     const vrDotN = vr.dot(N)

  //     // Tangent
  //     vr.subtract(N.multiplyScalar(vrDotN), T)
  //     if (T.isNearlyEqual(zeroVector, NEARLY_ZERO_MAGNITUDE)) {
  //       continue
  //     } else {
  //       T.normalize(T)
  //     }

  //     const vrDotT = vr.dot(T)
  //     const _jr = jrs[i]!
  //     const js = _jr * coeffs.friction.static
  //     const jd = _jr * coeffs.friction.dynamic
  //     // Frictional impulse magnitude (jf)
  //     const jf = vrDotT == 0 || vrDotT <= js ? -vrDotT : -jd
  //     const sqrd_rAcrossT_x_invI = Math.pow(rAOrth.dot(T), 2) * A.invInertia
  //     const sqrd_rBcrossT_x_invI = Math.pow(rBOrth.dot(T), 2) * B.invInertia
  //     const massDenom = sumInvMasses + sqrd_rAcrossT_x_invI + sqrd_rBcrossT_x_invI

  //     // Frictional impulse
  //     T.multiplyScalar(jf / massDenom / pointCount, frictionalImpulse)
  //     recordImpulse(resA, frictionalImpulse.multiplyScalar(-1), rA)
  //     recordImpulse(resB, frictionalImpulse, rB)
  //   }

  //   applyImpulse(resA)
  //   applyImpulse(resB)
  // }

  // function recordImpulse(res: Resolution, impulse: Vector, contactVector: Vector) {
  //   // console.log(contactVector, impulse)
  //   res.accImpulse.add(impulse, res.accImpulse)
  //   res.accAngularImpulse += contactVector.cross(impulse)
  // }

  // function applyImpulse(res: Resolution) {
  //   if (res.body.isStatic) {
  //     return
  //   }
  //   // console.log(res)
  //   res.body.velocity.x += res.accImpulse.x * res.body.invMass
  //   res.body.velocity.y += res.accImpulse.y * res.body.invMass
  //   res.body.angularVelocity += res.accAngularImpulse * res.body.invInertia

  //   res.accImpulse.set(0, 0)
  //   res.accAngularImpulse = 0
  // }
}
