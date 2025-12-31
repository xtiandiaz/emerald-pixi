import type { Body } from '../components'
import type { Vector } from '../core'
import type { Contact, CollisionLayerMap, Gravity } from './types'

type IntersectionPair = [number, number]

export class PhysicsEngine {
  private bodyMap: Map<number, Body>
  private bodies: [number, Body][]

  constructor(
    bodyEntries: [number, Body][],
    private gravity: Gravity,
    private layerMap?: CollisionLayerMap,
    private PPM: number = 10,
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
        const contact = A.collider.getContact(B.collider)
        if (!contact) {
          continue
        }
        this.separateBodies(A, B, contact.normal.multiplyScalar(contact.depth))
      }
    }
  }

  private stepAllBodies(dT: number) {
    for (const b of this.bodyMap.values()) {
      if (b.isStatic) {
        continue
      }
      if (!b.isKinematic) {
        const forces = this.gravity.vector.multiplyScalar(this.gravity.value * b.invMass)
        forces.x += b.force.x / dT
        forces.y += b.force.y / dT
        b.force.set(0, 0)

        b.velocity.x += forces.x * b.invMass * dT
        b.velocity.y += forces.y * b.invMass * dT
      }

      b.transform.position.x += b.velocity.x * this.PPM * dT
      b.transform.position.y += b.velocity.y * this.PPM * dT
    }
  }

  private getIntersectionPairs(): IntersectionPair[] {
    const pairs: IntersectionPair[] = []

    for (let i = 0; i < this.bodies.length - 1; i++) {
      const [idA, A] = this.bodies[i]!

      for (let j = i + 1; j < this.bodies.length; j++) {
        const [idB, B] = this.bodies[j]!

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

  private canCollide(layerA?: number, layerB?: number) {
    return (
      !this.layerMap ||
      (layerA && this.layerMap.get(layerA) && layerB) ||
      (layerB && this.layerMap.get(layerB) && layerA)
    )
  }
}
