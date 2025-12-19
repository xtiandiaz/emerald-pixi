import { System, type SignalBus, type World } from '../core'
import { Collider, RigidBody } from '../components'
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

        const col = cA.getCollision(cB)
        if (!col) {
          continue
        }
        const rbA = eA.getComponent(RigidBody)
        if (rbA) {
          rbA.force.set(rbA.force.x - col.direction.x, rbA.force.y - col.direction.y)
        }
        const rbB = eB.getComponent(RigidBody)
        if (rbB) {
          rbB.force.set(rbB.force.x + col.direction.x, rbB.force.y + col.direction.y)
        }
      }
    }
  }
}
