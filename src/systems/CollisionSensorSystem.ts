import { Collision, System, World, type SignalBus } from '../core'
import { Body, CollisionSensor } from '../components'

export interface CollisionSensorSystemOptions {
  collisionLayerMap?: Collision.LayerMap
}

export class CollisionSensorSystem extends System {
  private options: CollisionSensorSystemOptions

  constructor(options?: Partial<CollisionSensorSystemOptions>) {
    super()

    this.options = { ...options }
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const colliders = world.colliders
    let tag: string | undefined
    let sensor: CollisionSensor | undefined

    for (const [id, collider] of colliders) {
      const entity = world.getEntity(id)!

      if (!entity.hasComponent(Body)) {
        collider.setTransform(entity.position, entity.rotation)
      }
      // Clear collided IDs from previous step
      entity.getComponent(CollisionSensor)?.collidedIds.clear()
    }

    const intersectionPairs = Collision.findAABBIntersectionPairs(colliders, (idA, lA, idB, lB) => {
      return (
        Collision.canCollide(lA, lB, this.options.collisionLayerMap) &&
        (world.hasComponent(idA, CollisionSensor) || world.hasComponent(idB, CollisionSensor))
      )
    })

    for (const [eA, eB] of intersectionPairs) {
      if (!eA[1].findContact(eB[1], false)) {
        continue
      }

      const idA = eA[0]
      const idB = eB[0]

      sensor = world.getComponent(idA, CollisionSensor)
      tag = world.getEntityTag(idB)
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(eB[0])
      }
      sensor = world.getComponent(idB, CollisionSensor)
      tag = world.getEntityTag(idA)
      if (sensor && tag && sensor.targetTags.has(tag)) {
        sensor.collidedIds.add(eA[0])
      }
    }
  }
}
