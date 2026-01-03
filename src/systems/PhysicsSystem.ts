import { System, World, Vector, type SignalBus } from '../core'
import { Collision, Entity, Physics } from '../'
import { Body } from '../components'
import { CollisionSensor } from '../components/CollisionSensor'

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
    const colliders = world.colliders
    let entity!: Entity, body: Body | undefined

    for (const [id, collider] of colliders) {
      entity = world.getEntity(id)!

      body = entity.getComponent(Body)
      if (body) {
        entity.position.copyFrom(body.position)
        entity.rotation = body.rotation
      } else {
        collider.setTransform(entity.position, entity.rotation)
      }

      entity.getComponent(CollisionSensor)?.collidedIds.clear()
    }

    const idPairs = Collision.findAABBIntersectionIdPairs(colliders, (lA, lB) => true)
    let A: Entity, B: Entity
    let tag: string | undefined
    let sensor: CollisionSensor | undefined

    for (const [idA, idB] of idPairs) {
      A = world.getEntity(idA)!
      B = world.getEntity(idB)!

      sensor = A.getComponent(CollisionSensor)
      tag = B.getTag()
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(idB)
      }
      sensor = B.getComponent(CollisionSensor)
      tag = A.getTag()
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(idA)
      }
    }

    // const eBodies = world.eBodies
    // const bodies = eBodies.map((eb) => eb[1])
    // let A!: Body, B!: Body, container!: Container
    // dT /= this.options.iterations
    // for (let i = 0; i < this.options.iterations; i++) {
    //   for (const [_, b] of eBodies) {
    //     Physics.stepBody(b, this.options.gravity, this.options.PPM, dT)
    //   }
    //   const indexPairs = Collision.findAABBIntersectionIndexPairs(bodies, (lA, lB) =>
    //     Physics.canCollide(lA, lB, this.options.collisionLayerMap),
    //   )
    //   for (const [iA, iB] of indexPairs) {
    //     A = eBodies[iA]![1]
    //     B = eBodies[iB]![1]
    //     const isTrigger = A.isTrigger || B.isTrigger
    //     const contact = A.collider.findContact(B.collider, !isTrigger)
    //     if (!contact) {
    //       continue
    //     }
    //     if (isTrigger) {
    //       const idA = eBodies[iA]![0]
    //       const idB = eBodies[iB]![0]
    //       // signalBus.queue(
    //       //   new CollisionTriggered(
    //       //     { id: idA, tag: world.getEntityTag(idA) },
    //       //     { id: idB, tag: world.getEntityTag(idB) },
    //       //   ),
    //       // )
    //       continue
    //     }
    //     Physics.separateBodies(A, B, contact.normal.multiplyScalar(contact.depth))
    //     Physics.resolveCollision(A, B, contact)
    //   }
    // }
  }
}
