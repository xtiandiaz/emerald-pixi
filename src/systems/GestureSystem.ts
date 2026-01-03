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
    // const ecs = world.getEntityComponents(GestureTarget)
    // for (const [eId, target] of ecs) {
    //   const skin = world.getComponent(eId, ContainerChildComponent)
    //   if (!skin) {
    //     continue
    //   }
    //   skin.isInteractive = true
    //   skin.dermis.on('pointerdown', (ev) => this.targetGesture(eId, skin, ev, world))
    // }
    // world.interactive = true
    // world.eventMode = 'static'
    // this.connections.push(
    //   connectContainerEvent('pointerup', world, () => this.clearGesture(world)),
    //   connectContainerEvent('pointerupoutside', world, () => this.clearGesture(world)),
    // )
  }

  // private targetGesture(
  //   eId: number,
  //   skin: ContainerChildComponent,
  //   fpe: FederatedPointerEvent,
  //   world: World,
  // ) {
  //   this.target = {
  //     id: eId,
  //     offset: fpe.global.subtract(skin.position),
  //   }
  //   this.updateConnection = connectContainerEvent('globalpointermove', world, (fpe) => {
  //     this.updateGesture(fpe, world)
  //   })
  // }

  private updateGesture(fpe: FederatedPointerEvent, world: World) {
    if (!this.target) {
      return
    }
    const posX = fpe.x - this.target.offset.x
    const posY = fpe.y - this.target.offset.y
    const gt = world.getComponent(this.target.id, GestureTarget)
    if (gt && gt.gestures.includes(GestureKey.Drag)) {
      if (!gt.dragPosition) {
        gt.dragPosition = new Point(posX, posY)
      } else {
        gt.dragPosition.set(posX, posY)
      }
    }
  }

  private clearGesture(world: World) {
    this.updateConnection?.disconnect()

    if (this.target) {
      const gt = world.getComponent(this.target.id, GestureTarget)
      if (gt) {
        gt.dragPosition = undefined
      }
      this.target = undefined
    }
  }
}
