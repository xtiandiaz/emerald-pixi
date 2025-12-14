import { System, testForAABBV, type SignalBus, type World } from '../core'
import { CircleCS, Collider } from '../components'
import { CollisionSignal } from '../signals'
import type { HUD } from '../ui'
import { Graphics } from 'pixi.js'

export class CollisionSystem extends System {
  init(world: World, hud: HUD, sb: SignalBus): void {
    // const ecs = world.getEntitiesWithComponent(Collider)
    // for (const { e, c } of ecs) {
    //   if (c.shape instanceof CircleCS) {
    //     e.addChild(
    //       new Graphics()
    //         .circle(c.shape.x, c.shape.y, c.shape.r)
    //         .stroke({ width: 1, color: 0x00ffff }),
    //     )
    //   } else {
    //     e.addChild(new Graphics().poly(c.shape.vertices).stroke({ width: 1, color: 0x00ffff }))
    //   }
    // }
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
