import { System, World, Vector, type SignalBus } from '../core'
import { Collider, Collision, Entity, Physics } from '../'
import { Body, CollisionSensor } from '../components'
import { Graphics, RenderLayer } from 'pixi.js'
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
      iterations: 1,
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
    const colliders = world.colliders
    let entity!: Entity, body: Body | undefined

    this.debug.clear()

    // dT /= this.options.iterations
    // for (let i = 0; i < this.options.iterations; i++) {
    for (const [id, collider] of colliders) {
      entity = world.getEntity(id)!

      body = entity.getComponent(Body)
      if (body) {
        this.engine.stepBody(body, gravity, PPM, dT)
        entity.position.copyFrom(body.position)
        entity.rotation = body.rotation
      } else {
        collider.setTransform(entity.position, entity.rotation)
      }
      // Clear collided IDs from previous step
      entity.getComponent(CollisionSensor)?.collidedIds.clear()
    }

    const colliderPairs = Collision.findAABBIntersectionIdPairs(colliders, (lA, lB) =>
      Collision.canCollide(lA, lB, this.options.collisionLayerMap),
    )

    let A: Entity, B: Entity
    let colliderA: Collider | undefined, colliderB: Collider | undefined
    let tag: string | undefined
    let sensor: CollisionSensor | undefined
    let bodyA: Body | undefined, bodyB: Body | undefined
    let contact: Collision.Contact | undefined
    let shouldResolve = false

    for (const [eA, eB] of colliderPairs) {
      A = world.getEntity(eA[0])!
      B = world.getEntity(eB[0])!
      colliderA = eA[1]
      colliderB = eB[1]
      bodyA = A.getComponent(Body)
      bodyB = B.getComponent(Body)
      shouldResolve = bodyA != undefined || bodyB != undefined

      contact = colliderA.findContact(colliderB, shouldResolve)
      if (!contact) {
        continue
      }
      this.drawContact(contact)

      sensor = A.getComponent(CollisionSensor)
      tag = B.getTag()
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(eB[0])
      }
      sensor = B.getComponent(CollisionSensor)
      tag = A.getTag()
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(eA[0])
      }

      if (!bodyA || !bodyB) {
        continue
      }

      this.engine.separateBodies(bodyA, bodyB, contact.normal.multiplyScalar(contact.depth))

      this.engine.resolveCollision(bodyA, bodyB, contact)
    }
    // }
  }

  drawContact(contact: Collision.Contact) {
    for (const point of contact.points!) {
      this.debug.circle(point.x, point.y, 5).stroke({ color: 0xffffff, width: 2 })
    }
  }
}
