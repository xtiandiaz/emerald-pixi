import { System, type SignalBus, type World } from '../core'
import { Collider } from '../components'
import { CollisionSignal } from '../signals'
import type { HUD } from '../ui'

export class CollisionSystem extends System {
  protected ongoingCollisions = new Map<number, Set<number>>()

  constructor(protected layerMap: Map<number, number>) {
    super()
  }

  init(world: World, hud: HUD, sb: SignalBus): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (const { e, c } of ecs) {
      e.addChild(c.createDebugGraphics())
    }
  }

  deinit(): void {
    super.deinit()

    this.ongoingCollisions.clear()
  }

  update(world: World, sb: SignalBus, dt: number): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (let i = 0; i < ecs.length; i++) {
      const { e: eA, c: cA } = ecs[i]!

      for (let j = i + 1; j < ecs.length; j++) {
        const { e: eB, c: cB } = ecs[j]!

        // cA.position.copyFrom(eA.position)
        // cA.rotation = eA.rotation
        // cA.updateVertices()
        // cB.position.copyFrom(eB.position)
        // cB.rotation = eB.rotation
        // cB.updateVertices()

        const areMeantToCollide =
          ((this.layerMap.get(cA.layer) ?? 0) && cB.layer) ||
          ((this.layerMap.get(cB.layer) ?? 0) && cA.layer)

        if (areMeantToCollide && cA.testForCollision(cB)) {
          if (!this.ongoingCollisions.has(eA.id) && !this.ongoingCollisions.has(eB.id)) {
            this.ongoingCollisions.set(eA.id, new Set([eB.id]))
            sb.queue(new CollisionSignal(eA.id, eB.id))
          }
        } else {
          this.ongoingCollisions.delete(eA.id)
          this.ongoingCollisions.delete(eB.id)
        }
      }
    }
  }
}
