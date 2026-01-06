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

  /* 
    Moment of inertia of area: https://en.wikipedia.org/wiki/Moment_of_inertia#Moment_of_inertia_of_area
  */
  export function calculateColliderInertia(collider: Collider) {
    if (collider instanceof CircleCollider) {
      return (Math.PI * Math.pow(collider._radius, 4)) / 4
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
    }

    body.transform.position.x += body.velocity.x * PPM * dT
    body.transform.position.y += body.velocity.y * PPM * dT
    body.transform.rotation += body.angularVelocity * dT
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
      restitution: average(A.restitution, B.restitution),
      friction: {
        // static: Math.sqrt(A.friction.static * B.friction.static),
        // dynamic: Math.sqrt(A.friction.dynamic * B.friction.dynamic),
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
    const rA = new Vector()
    const rB = new Vector()
    const rAOrth = new Vector()
    const rBOrth = new Vector()
    // Velocities of (shared) point: vpi = vi + ⍵i ⨯ ri
    const vpA = new Vector()
    const vpB = new Vector()
    // Relative velocity: vr = vB - vA
    const vr = new Vector()
    const tangent = new Vector()
    const impulse = new Vector()
    const frictionalImpulse = new Vector()

    for (const collisionPoint of contact.points) {
      const N = contact.normal

      collisionPoint.subtract(A.position, rA)
      collisionPoint.subtract(B.position, rB)

      // vpi = vi + ⍵i ⨯ ri
      // where ⍵ in 2D is the derivative (tangent) of the angle, i.e., the orthogonal of r
      // https://en.wikipedia.org/wiki/Angular_velocity#Particle_in_two_dimensions
      A.velocity.add(rA.orthogonalize(rAOrth).multiplyScalar(A.angularVelocity), vpA)
      B.velocity.add(rB.orthogonalize(rBOrth).multiplyScalar(B.angularVelocity), vpB)

      vpB.subtract(vpA, vr)

      const vrDotN = vr.dot(N)
      if (vrDotN > 0) {
        return
      }
      // Reaction impulse magnitude (jr)
      let jr = -(1 + coeffs.restitution) * vrDotN
      const rA_x_rAcrossN_x_invI = rA.multiplyScalar(rA.cross(N) * A.invScaledInertia)
      const rB_x_rBcrossN_x_invI = rB.multiplyScalar(rB.cross(N) * B.invScaledInertia)
      const denom =
        A.invScaledMass + B.invScaledMass + N.dot(rA_x_rAcrossN_x_invI.add(rB_x_rBcrossN_x_invI))
      jr /= denom
      jr /= contact.points.length

      // Reaction impulse (Jr)
      N.multiplyScalar(jr, impulse)
      applyImpulse(A, impulse.multiplyScalar(-1), rA)
      applyImpulse(B, impulse, rB)

      // Tangent
      vr.subtract(N.multiplyScalar(vrDotN), tangent)
      if (tangent.isNearlyEqual(zeroVector, NEARLY_ZERO_MAGNITUDE)) {
        return
      } else {
        tangent.normalize(tangent)
      }

      // Frictional impulse (Jf)
      const vrDotTan = vr.dot(tangent)
      const calculateFrictionalImpulse = (mass: number, negate: boolean = false) => {
        const scalar =
          vrDotTan == 0 || mass * vrDotTan <= coeffs.friction.static * jr
            ? -mass * vrDotTan
            : -coeffs.friction.dynamic * jr
        return tangent.multiplyScalar(scalar * (negate ? -1 : 1), frictionalImpulse)
      }
      calculateFrictionalImpulse(A.scaledMass, true)
      applyImpulse(A, frictionalImpulse, rA)
      calculateFrictionalImpulse(B.scaledMass)
      applyImpulse(B, frictionalImpulse, rB)
    }
  }

  function applyImpulse(body: Body, impulse: Vector, contactVector: Vector) {
    if (body.isStatic) {
      return
    }
    body.velocity.x += impulse.x * body.invScaledMass
    body.velocity.y += impulse.y * body.invScaledMass
    // body.angularVelocity = contactVector.cross(impulse) * body.invScaledInertia
  }
}
