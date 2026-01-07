import { System, World, Vector, type SignalBus } from '../core'
import { Collider, Collision, Entity, Physics } from '../'
import { Body, CollisionSensor } from '../components'

export interface PhysicsSystemOptions {
  gravity: Physics.Gravity
  iterations: number
  PPM: number // Pixels Per Meter
  collisionLayerMap?: Collision.LayerMap
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions
  private accumulatedForces = new Map<number, Vector>()

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

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const gravity = this.options.gravity
    const PPM = this.options.PPM
    const colliders = world.colliders
    let entity!: Entity, body: Body | undefined

    for (const [id, collider] of colliders) {
      entity = world.getEntity(id)!

      body = entity.getComponent(Body)
      if (body) {
        Physics.stepBody(body, gravity, PPM, dT)
        entity.position.copyFrom(body.position)
        entity.rotation = body.rotation
        // entity.scale.set(body.scale, body.scale)
      } else {
        collider.setTransform(
          entity.position,
          entity.rotation /*, {
          x: entity.scale.x,
          y: entity.scale.x, // Dimensional scale not yet supported for colliders!
        } */,
        )
      }
      // Clear collided IDs from previous step
      entity.getComponent(CollisionSensor)?.collidedIds.clear()
    }

    const colliderPairs = Collision.findAABBIntersectionIdPairs(colliders, (lA, lB) =>
      Physics.canCollide(lA, lB, this.options.collisionLayerMap),
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
      Physics.separateBodies(bodyA, bodyB, contact.normal.multiplyScalar(contact.depth))
      Physics.resolveCollision(bodyA, bodyB, contact)
    }
  }
}
