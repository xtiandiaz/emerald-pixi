import type { Body } from '../components'
import { Vector, Collision } from '../core'
import { Physics } from './'

export class PhysicsEngine {
  private bodyMap: Map<number, Body>
  private bodies: [number, Body][]

  constructor(
    bodyEntries: [number, Body][],
    private gravity: Physics.Gravity,
    private PPM: number,
    private layerMap?: Collision.LayerMap,
  ) {
    this.bodyMap = new Map(bodyEntries)
    this.bodies = [...this.bodyMap.entries()]
  }

  addBody(id: number, body: Body) {
    this.bodyMap.set(id, body)
    this.bodies = [...this.bodyMap.entries()]
  }
  removeBody(id: number) {
    if (this.bodyMap.delete(id)) {
      this.bodies = [...this.bodyMap.entries()]
    }
  }

  step(iterations: number, dT: number) {
    dT /= iterations
    for (let i = 0; i < iterations; i++) {
      this.stepAllBodies(dT)

      const pairs = this.getIntersectionPairs()

      for (const [idA, idB] of pairs) {
        const A = this.bodyMap.get(idA)!
        const B = this.bodyMap.get(idB)!
        const collision = A.findCollision(B)
        if (!collision) {
          continue
        }
        this.separateBodies(A, B, collision.normal.multiplyScalar(collision.depth))
        this.resolveCollision(A, B, collision)
      }
    }
  }

  private stepAllBodies(dT: number) {
    for (const b of this.bodyMap.values()) {
      if (b.isStatic) {
        continue
      }
      if (!b.isKinematic) {
        // TODO Apply inv-mass after solving the meters vs pixels conundrum
        const forces = this.gravity.vector.multiplyScalar(this.gravity.value /* * b.invMass */)
        forces.x += b.force.x / dT
        forces.y += b.force.y / dT
        b.force.set(0, 0)

        b.velocity.x += forces.x /* * b.invMass */ * dT
        b.velocity.y += forces.y /* * b.invMass */ * dT
      }
      b.transform.position.x += b.velocity.x * this.PPM * dT
      b.transform.position.y += b.velocity.y * this.PPM * dT
    }
  }

  private canCollide(layerA?: number, layerB?: number) {
    return (
      !this.layerMap ||
      (layerA && this.layerMap.get(layerA) && layerB) ||
      (layerB && this.layerMap.get(layerB) && layerA)
    )
  }

  private getIntersectionPairs(): Collision.AABBIntersectionPair[] {
    const pairs: Collision.AABBIntersectionPair[] = []

    for (let i = 0; i < this.bodies.length - 1; i++) {
      const [idA, A] = this.bodies[i]!

      for (let j = i + 1; j < this.bodies.length; j++) {
        const [idB, B] = this.bodies[j]!

        if (A.isStatic && B.isStatic) {
          continue
        }
        if (this.canCollide(A.layer, B.layer) && A.collider.hasAABBIntersection(B.collider)) {
          pairs.push([idA, idB])
        }
      }
    }
    return pairs
  }

  private separateBodies(A: Body, B: Body, depth: Vector) {
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
  private resolveCollision(A: Body, B: Body, collision: Physics.Collision) {
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
