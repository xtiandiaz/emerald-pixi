import type { Point } from 'pixi.js'
import { CircleCollider, Collision, Vector, type Collider } from '.'
import { type Body, type EntityBody } from '../components'

export namespace Physics {
  export interface Gravity {
    vector: Vector
    value: number
  }

  export interface Friction {
    static: number
    dynamic: number
  }

  export type IntersectionPair = [Body, Body]

  export interface Collision extends Collision.Result {
    points: Point[]
    restitution: number
    friction: Friction
  }

  export interface Options {
    gravity: Gravity
    iterations: number
    PPM: number
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

  export function step(eBodies: EntityBody[], options: Options, dT: number) {
    dT /= options.iterations
    for (let i = 0; i < options.iterations; i++) {
      stepBodies(eBodies, options.gravity, options.PPM, dT)

      const pairs = findIntersectionPairs(eBodies, options.collisionLayerMap)

      for (const [A, B] of pairs) {
        const collision = A.findCollision(B)
        if (!collision) {
          continue
        }
        separateBodies(A, B, collision.normal.multiplyScalar(collision.depth))
        resolveCollision(A, B, collision)
      }
    }
  }

  function stepBodies(eBodies: EntityBody[], gravity: Gravity, PPM: number, dT: number) {
    for (const [_, b] of eBodies) {
      if (b.isStatic) {
        continue
      }
      if (!b.isKinematic) {
        // TODO Apply inv-mass after solving the meters vs pixels conundrum
        const forces = gravity.vector.multiplyScalar(gravity.value /* * b.invMass */)
        forces.x += b.force.x / dT
        forces.y += b.force.y / dT
        b.force.set(0, 0)

        b.velocity.x += forces.x /* * b.invMass */ * dT
        b.velocity.y += forces.y /* * b.invMass */ * dT
      }
      b.transform.position.x += b.velocity.x * PPM * dT
      b.transform.position.y += b.velocity.y * PPM * dT
    }
  }

  function canCollide(layerMap?: Collision.LayerMap, layerA?: number, layerB?: number) {
    return (
      !layerMap ||
      (layerA && layerMap.get(layerA) && layerB) ||
      (layerB && layerMap.get(layerB) && layerA)
    )
  }

  function findIntersectionPairs(
    bodies: EntityBody[],
    layerMap?: Collision.LayerMap,
  ): IntersectionPair[] {
    const pairs: IntersectionPair[] = []

    for (let i = 0; i < bodies.length - 1; i++) {
      const A = bodies[i]![1]

      for (let j = i + 1; j < bodies.length; j++) {
        const B = bodies[j]![1]

        if (A.isStatic && B.isStatic) {
          continue
        }
        if (canCollide(layerMap, A.layer, B.layer) && A.collider.hasAABBIntersection(B.collider)) {
          pairs.push([A, B])
        }
      }
    }
    return pairs
  }

  function separateBodies(A: Body, B: Body, depth: Vector) {
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

  /*  
    Collision Response: https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model
  */
  function resolveCollision(A: Body, B: Body, collision: Physics.Collision) {
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

    for (const collisionPoint of collision.points) {
      const N = collision.normal

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
      let jr = -(1 + collision.restitution) * contactVelMag
      const rA_x_rAcrossN_x_invI = rA.multiplyScalar(rA.cross(N) * A.invInertia)
      const rB_x_rBcrossN_x_invI = rB.multiplyScalar(rB.cross(N) * B.invInertia)
      jr /= A.invMass + B.invMass + N.dot(rA_x_rAcrossN_x_invI.add(rB_x_rBcrossN_x_invI))
      jr /= collision.points.length

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
