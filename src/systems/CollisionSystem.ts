import { Body, CollisionSensor } from '../components'
import { System, World, type SignalBus } from '../core'

// export class CollisionSystem extends System {
//   fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
//     const colliders = world._colliders
//     let tag: string | undefined
//     let sensor: CollisionSensor | undefined

//     for (const [id, collider] of colliders) {
//       const entity = world.getEntity(id)!

//       collider.setTransform(entity.position, entity.rotation)

//       // Clear collided IDs from previous step
//       entity.getComponent(CollisionSensor)?.collidedIds.clear()
//     }
//   }
// }
