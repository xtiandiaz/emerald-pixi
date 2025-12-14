import { System, testForAABBV, type SignalBus, type World } from '../core'
import { Collider } from '../components'
import { CollisionSignal } from '../signals'

export class CollisionSystem extends System {
  update(world: World, sb: SignalBus, dt: number): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (let i = 0; i < ecs.length; i++) {
      const { e: eA, c: cA } = ecs[i]!
      for (let j = i + 1; j < ecs.length; j++) {
        const { e: eB, c: cB } = ecs[j]!
        cA.update(eA.position, eA.rotation)
        cB.update(eB.position, eB.rotation)

        if (testForAABBV(cA.aabb, cB.aabb)) {
          sb.emit(new CollisionSignal(eA.id, eB.id))
        }
      }
      // if (c.shape instanceof Rectangle) {
      //   console.log('rect')
      // } else if (c.shape instanceof Circle) {
      //   console.log('circle')
      // }
    }
  }
}
