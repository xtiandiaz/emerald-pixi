import { average, CircleCollider, Collision, Vector, type Collider } from '.'
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
  export function calculateMass(area: number, density: number = 1) {
    return area * density
  }

  export function calculateColliderInertia(collider: Collider, mass: number) {
    if (collider instanceof CircleCollider) {
      return mass * Math.pow(collider._radius, 2) * 0.5
    } else {
      const w = collider.aabb.max.x - collider.aabb.min.x
      const h = collider.aabb.max.y - collider.aabb.min.y
      const numberOfVertices = collider.vertices.length
      switch (numberOfVertices) {
        case 3:
          return (w * Math.pow(h, 3)) / 36
        case 4:
          return (w * Math.pow(h, 3)) / 12
        default:
          throw new Error(
            `Inertia for polygons of ${numberOfVertices} vertices is NOT yet calculated!`,
          )
      }
    }
  }

  export function stepBody(body: Body, gravity: Gravity, PPM: number, dT: number) {
    if (body.isStatic) {
      return
    }
    if (!body.isKinematic) {
      // TODO Apply inv-mass after solving the meters vs pixels conundrum
      const forces = gravity.vector.multiplyScalar(gravity.value /* * body.invMass */)
      forces.x += (body.force.x * PPM) / dT
      forces.y += (body.force.y * PPM) / dT
      body.force.set(0, 0)

      body.velocity.x += forces.x /* * body.invMass */ * dT
      body.velocity.y += forces.y /* * body.invMass */ * dT

      body.angularVelocity += body.torque * dT
      body.torque = 0
      body.angularVelocity *= 1 - body.angularDrag
    }

    body.transform.position.x += body.velocity.x * PPM * dT
    body.transform.position.y += body.velocity.y * PPM * dT
    body.transform.rotation += body.angularVelocity * PPM * dT
  }

  export function canCollide(layerA: number, layerB: number, map?: Collision.LayerMap): boolean {
    return !map || (((map.get(layerA) ?? 0) & layerB) | ((map.get(layerB) ?? 0) & layerA)) != 0
  }

  export function separateBodies(A: Body, B: Body, depth: Vector) {
    if (A.isStatic) {
      B.transform.position.x += depth.x
      B.transform.position.y += depth.y
    } else if (B.isStatic) {
      A.transform.position.x -= depth.x
      A.transform.position.y -= depth.y
    } else {
      A.transform.position.x -= depth.x * 0.5
      A.transform.position.y -= depth.y * 0.5
      B.transform.position.x += depth.x * 0.5
      B.transform.position.y += depth.y * 0.5
    }
  }

  interface ResolutionCoefficients {
    restitution: number
    friction: Friction
  }
  function getResolutionCoefficients(A: Body, B: Body): ResolutionCoefficients {
    return {
      restitution: Math.max(A.restitution, B.restitution),
      friction: {
        static: average(A.friction.static, B.friction.static),
        dynamic: average(A.friction.dynamic, B.friction.dynamic),
      },
    }
  }

  /*  
    Collision Response: https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model
  */
  export function resolveCollision(A: Body, B: Body, contact: Collision.Contact) {
    if (!contact.points) {
      return
    }

    const zeroVector = new Vector()
    const coeffs = getResolutionCoefficients(A, B)
    const sumInvMasses = A.invMass + B.invMass
    const rA = new Vector()
    const rB = new Vector()
    const rAOrth = new Vector()
    const rBOrth = new Vector()
    // Relative velocity
    const vr = new Vector()
    const T = new Vector()
    const impulse = new Vector()
    const frictionalImpulse = new Vector()

    for (const collisionPoint of contact.points) {
      const N = contact.normal

      collisionPoint.subtract(A.position, rA)
      collisionPoint.subtract(B.position, rB)
      rAOrth.set(-rA.y, rA.x)
      rBOrth.set(-rB.y, rB.x)

      calculateRelativeVelocity(A, B, rAOrth, rBOrth, vr)

      const vrDotN = vr.dot(N)
      if (vrDotN > 0) {
        return
      }
      // Reaction impulse magnitude (jr)
      const jr = -(1 + coeffs.restitution) * vrDotN
      const rA_x_rAcrossN_x_invI = rA.multiplyScalar(rA.cross(N) * A.invInertia)
      const rB_x_rBcrossN_x_invI = rB.multiplyScalar(rB.cross(N) * B.invInertia)
      let effectiveMass = 1 / (sumInvMasses + N.dot(rA_x_rAcrossN_x_invI.add(rB_x_rBcrossN_x_invI)))

      // Reaction impulse
      N.multiplyScalar(jr * effectiveMass, impulse)
      applyImpulse(A, impulse.multiplyScalar(-1), rA)
      applyImpulse(B, impulse, rB)

      // Tangent
      vr.subtract(N.multiplyScalar(vrDotN), T)
      if (T.isNearlyEqual(zeroVector, NEARLY_ZERO_MAGNITUDE)) {
        continue
      } else {
        T.normalize(T)
      }

      const vrDotT = vr.dot(T)
      const js = jr * coeffs.friction.static
      const jd = jr * coeffs.friction.dynamic
      // Frictional impulse magnitude (jf)
      const jf = vrDotT == 0 || vrDotT <= js ? -vrDotT : -jd
      const rA_x_rAcrossT_x_invI = rA.multiplyScalar(rA.cross(T) * A.invInertia)
      const rB_x_rBcrossT_x_invI = rB.multiplyScalar(rB.cross(T) * B.invInertia)
      effectiveMass = 1 / (sumInvMasses + T.dot(rA_x_rAcrossT_x_invI.add(rB_x_rBcrossT_x_invI)))

      // Frictional impulse
      T.multiplyScalar(jf * effectiveMass, frictionalImpulse)
      applyImpulse(A, frictionalImpulse.multiplyScalar(-1), rA)
      applyImpulse(B, frictionalImpulse, rB)
    }
  }

  function calculateRelativeVelocity(
    A: Body,
    B: Body,
    rAOrth: Vector,
    rBOrth: Vector,
    outVector: Vector,
  ) {
    B.velocity
      // Velocities of (shared) point: vpi = vi + ⍵i ⨯ ri
      .add(rBOrth.multiplyScalar(B.angularVelocity), outVector)
      .subtract(A.velocity, outVector)
      .subtract(rAOrth.multiplyScalar(A.angularVelocity), outVector)
  }

  function applyImpulse(body: Body, impulse: Vector, contactVector: Vector) {
    if (body.isStatic) {
      return
    }
    body.velocity.x += impulse.x * body.invMass
    body.velocity.y += impulse.y * body.invMass
    body.angularVelocity += contactVector.cross(impulse) * body.invInertia
  }
}
