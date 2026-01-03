import type { Point } from 'pixi.js'
import { average, CircleCollider, Collision, Vector, type Collider } from '.'
import { type Body } from '../components'

export namespace Physics {
  export interface Gravity {
    vector: Vector
    value: number
  }
  export interface Friction {
    static: number
    dynamic: number
  }

  export interface Options {
    gravity: Gravity
    iterations: number
    PPM: number // Pixels Per Meter
    collisionLayerMap?: Collision.LayerMap
  }

  /* 
    Area Density: https://en.wikipedia.org/wiki/Area_density
  */
  export function calculateMass(area: number, density: number = 1) {
    return area * density
  }

  export function calculateColliderInertia(collider: Collider, mass: number) {
    if (collider instanceof CircleCollider) {
      return mass * collider.radius * collider.radius
    } else {
      // TODO Find out why
      const w = collider.aabb.max.x - collider.aabb.min.x
      const h = collider.aabb.max.y - collider.aabb.min.y
      return (mass * (w * w + h * h)) / 12
    }
  }

  export function stepBody(body: Body, gravity: Gravity, PPM: number, dT: number) {
    if (body.isStatic) {
      return
    }
    if (!body.isKinematic) {
      // TODO Apply inv-mass after solving the meters vs pixels conundrum
      const forces = gravity.vector.multiplyScalar(gravity.value /* * body.invMass */)
      forces.x += body.force.x / dT
      forces.y += body.force.y / dT
      body.force.set(0, 0)

      body.velocity.x += forces.x /* * body.invMass */ * dT
      body.velocity.y += forces.y /* * body.invMass */ * dT
    }

    body.transform.position.x += body.velocity.x * PPM * dT
    body.transform.position.y += body.velocity.y * PPM * dT
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

    for (const collisionPoint of contact.points) {
      const N = contact.normal

      collisionPoint.subtract(A.position, rA)
      collisionPoint.subtract(B.position, rB)
      rA.orthogonalize(rAOrth)
      rB.orthogonalize(rBOrth)

      A.velocity.add(rAOrth.multiplyScalar(A.angularVelocity), vpA)
      B.velocity.add(rBOrth.multiplyScalar(B.angularVelocity), vpB)

      vpB.subtract(vpA, vr)

      const contactVelMag = vr.dot(N)
      if (contactVelMag > 0) {
        // Already separating...
        return
      }

      // const rAOrthDotTan = rAOrth.dot(tangent)
      // const rBOrthDotTan = rBOrth.dot(tangent)

      // Reaction impulse (jr)
      let jr = -(1 + coeffs.restitution) * contactVelMag
      const rA_x_rAcrossN_x_invI = rA.multiplyScalar(rA.cross(N) * A.invInertia)
      const rB_x_rBcrossN_x_invI = rB.multiplyScalar(rB.cross(N) * B.invInertia)
      jr /= A.invMass + B.invMass + N.dot(rA_x_rAcrossN_x_invI.add(rB_x_rBcrossN_x_invI))
      jr /= contact.points.length

      const impulse = N.multiplyScalar(jr)
      if (!A.isStatic) {
        A.velocity.x -= impulse.x * A.invMass
        A.velocity.y -= impulse.y * A.invMass
        A.angularVelocity -= jr * rA.cross(N) * A.invInertia
      }
      if (!B.isStatic) {
        B.velocity.x += impulse.x * B.invMass
        B.velocity.y += impulse.y * B.invMass
        B.angularVelocity += jr * rA.cross(N) * B.invInertia
      }
    }
  }
}
