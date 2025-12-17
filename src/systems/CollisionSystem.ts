import { System, type SignalBus, type World } from '../core'
import { Collider } from '../components'
import { CollisionSignal } from '../signals'
import type { HUD } from '../ui'

export class CollisionSystem extends System {
  init(world: World, hud: HUD, sb: SignalBus): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (const { e, c } of ecs) {
      e.addChild(c.shape.createDebugGraphics())
    }
  }

  update(world: World, sb: SignalBus, dt: number): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (let i = 0; i < ecs.length; i++) {
      const { e: eA, c: cA } = ecs[i]!

      for (let j = i + 1; j < ecs.length; j++) {
        const { e: eB, c: cB } = ecs[j]!

        cA.update(eA.position, eA.rotation)
        cB.update(eB.position, eB.rotation)

        if (cA.collides(cB)) {
          // sb.emit(new CollisionSignal(eA.id, eB.id))
          console.log('collision')
        }
      }
    }
  }
}
