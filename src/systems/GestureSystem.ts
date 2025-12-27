import { Point, type FederatedPointerEvent } from 'pixi.js'
import { GestureTarget } from '../components/GestureTarget'
import { System, World, type Disconnectable, type SignalBus } from '../core'
import { GestureKey } from '../input'
import { connectContainerEvent } from '../input/utils'
import type { HUD } from '../ui'
import { Body } from '../components'

interface Target {
  id: number
  offset: Point
}

export class GestureSystem extends System {
  private target?: Target
  private updateConnection?: Disconnectable

  init(world: World, hud: HUD, sb: SignalBus): void {
    const ecs = world.getEntitiesWithComponent(GestureTarget)
    for (const { e } of ecs) {
      e.interactive = true
      e.on('pointerdown', (ev) => this.targetGesture(e.id, ev, world))
    }

    world.interactive = true
    world.eventMode = 'static'
    this.connections.push(
      connectContainerEvent('pointerup', world, () => this.clearGesture(world)),
      connectContainerEvent('pointerupoutside', world, () => this.clearGesture(world)),
    )
  }

  private targetGesture(eId: number, fpe: FederatedPointerEvent, w: World) {
    const e = w.getEntity(eId)
    const gtc = e?.getComponent(GestureTarget)
    if (!e) {
      return
    }
    this.target = {
      id: eId,
      offset: fpe.global.subtract(e.getComponent(Body)?.position ?? e.position),
    }
    this.updateConnection = connectContainerEvent('globalpointermove', w, (fpe) => {
      this.updateGesture(fpe, w)
    })
  }

  private updateGesture(fpe: FederatedPointerEvent, w: World) {
    if (!this.target) {
      return
    }
    const posX = fpe.x - this.target.offset.x
    const posY = fpe.y - this.target.offset.y
    const e = w.getEntity(this.target.id)
    const gt = e?.getComponent(GestureTarget)
    if (gt && gt.gestures.includes(GestureKey.Drag)) {
      if (!gt.dragPosition) {
        gt.dragPosition = new Point(posX, posY)
      } else {
        gt.dragPosition.set(posX, posY)
      }
    }
  }

  private clearGesture(w: World) {
    this.updateConnection?.disconnect()

    if (this.target) {
      const gt = w.getEntity(this.target.id)?.getComponent(GestureTarget)
      if (gt) {
        gt.dragPosition = undefined
      }
      this.target = undefined
    }
  }
}
