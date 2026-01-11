import { Graphics } from 'pixi.js'
import { System, World, Vector, type SignalBus } from '../core'
import { PhysicsEngine } from '../physics'
import { Collision, Physics } from '../'

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
    const bodies = world._bodies
    const separation = new Vector()
    let collision: Collision.Instance

    dT /= this.options.iterations
    for (let it = 0; it < this.options.iterations; it++) {
      this.debug.clear()

      for (let i = 0; i < bodies.length; i++) {
        const [entityId, body] = bodies[i]!

        this.engine.stepBody(body, gravity, PPM, dT)

        const entity = world.getEntity(entityId)!
        entity.position.copyFrom(body.position)
        entity.rotation = body.rotation
      }

      const collisions = Collision.findInstances(bodies, (lA, lB) =>
        Collision.canCollide(lA, lB, this.options.collisionLayerMap),
      )

      for (let i = 0; i < collisions.length; i++) {
        collision = collisions[i]!

        this.drawCollision(collision)

        this.engine.separateBodies(
          collision.A,
          collision.B,
          collision.normal.multiplyScalar(collision.depth, separation),
        )

        this.engine.resolveCollision(collision)
      }
    }
  }

  private drawCollision(contact: Collision.ShapeContact) {
    for (const point of contact.points!) {
      this.debug.circle(point.x, point.y, 5).stroke({ color: 0xffffff, width: 2 })
    }
  }
}
