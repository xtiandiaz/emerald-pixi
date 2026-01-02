import { System, World, Vector, type SignalBus } from '../core'
import { Collision, Physics } from '../'
import { Body, Skin } from '../components'

export interface PhysicsSystemOptions extends Physics.Options {
  rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      gravity: {
        vector: new Vector(0, 1),
        value: 9.81, // m/s^2
      },
      PPM: 10,
      iterations: 12,
      rendersColliders: false,
      ...options,
    }
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const eBodies = world.eBodies
    const bodies = eBodies.map((eb) => eb[1])
    let A!: Body, B!: Body

    dT /= this.options.iterations
    for (let i = 0; i < this.options.iterations; i++) {
      for (const b of bodies) {
        Physics.stepBody(b, this.options.gravity, this.options.PPM, dT)
      }
      const indexPairs = Collision.findAABBIntersectionIndexPairs(bodies, (lA, lB) =>
        Physics.canCollide(lA, lB, this.options.collisionLayerMap),
      )
      for (const [iA, iB] of indexPairs) {
        A = bodies[iA]!
        B = bodies[iB]!
        const collision = A.findCollision(B)
        if (!collision) {
          continue
        }
        Physics.separateBodies(A, B, collision.normal.multiplyScalar(collision.depth))
        Physics.resolveCollision(A, B, collision)
      }
    }

    for (const [entityId, b] of eBodies) {
      world.getComponent(entityId, Skin)?.position.set(b.position.x, b.position.y)
    }
  }
}
