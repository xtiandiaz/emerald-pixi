import { System, World, Vector, type SignalBus } from '../core'
import { Collision, Physics } from '../'
import { Graphics } from 'pixi.js'
import { PhysicsEngine } from '../physics'

export interface PhysicsSystemOptions {
  gravity: Physics.Gravity
  iterations: number
  PPM: number // Pixels Per Meter
  collisionLayerMap?: Collision.LayerMap
}

export class PhysicsSystem extends System {
  private engine = new PhysicsEngine()
  private options: PhysicsSystemOptions
  private debug = new Graphics()

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      gravity: {
        vector: new Vector(0, 1),
        value: 9.81, // m/s^2
      },
      PPM: 10,
      iterations: 4,
      ...options,
    }
  }

  resetOptions(options: Partial<PhysicsSystemOptions>) {
    this.options = {
      ...this.options,
      ...options,
    }
  }

  init(world: World, signalBus: SignalBus): void {
    world.addChild(this.debug)
    world.getLayer(World.Layer.DEBUG).attach(this.debug)
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const gravity = this.options.gravity
    const PPM = this.options.PPM
    const bodies = world.bodies
    const separation = new Vector()
    let contact: Collision.Contact | undefined

    dT /= this.options.iterations
    for (let it = 0; it < this.options.iterations; it++) {
      this.debug.clear()

      for (const [id, body] of bodies) {
        this.engine.stepBody(body, gravity, PPM, dT)

        const entity = world.getEntity(id)!
        entity.position.copyFrom(body.position)
        entity.rotation = body.rotation
      }

      const bodyPairs = Collision.findAABBIntersectionPairsForBodies(bodies, (lA, lB) =>
        Collision.canCollide(lA, lB, this.options.collisionLayerMap),
      )

      for (const [[idA, bodyA], [idB, bodyB]] of bodyPairs) {
        contact = bodyA.collider.findContact(bodyB.collider, true)
        if (!contact) {
          continue
        }
        this.drawContact(contact)

        this.engine.separateBodies(
          bodyA,
          bodyB,
          contact.normal.multiplyScalar(
            contact.depth,
            // (contact.depth * (it + 1)) / this.options.iterations,
            separation,
          ),
        )

        this.engine.resolveCollision(bodyA, bodyB, contact)
      }
    }
  }

  private drawContact(contact: Collision.Contact) {
    for (const point of contact.points!) {
      this.debug.circle(point.x, point.y, 5).stroke({ color: 0xffffff, width: 2 })
    }
  }
}
