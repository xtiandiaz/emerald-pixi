import { System, World, type SignalBus, type SignalEmitter } from '../core'
import { GestureComponent, GestureTargetComponent } from '../components'
import { GestureSignal } from '../signals'
import { GesturePhase, type Gesture } from '../input'

export class GestureSystem extends System {
  private gestureBuffer: Gesture[] = []
  private disposalTargets: number[] = []

  init(world: World, sbe: SignalBus & SignalEmitter): void {
    this.disconnectables.push(sbe.connect(GestureSignal, (s) => this.gestureBuffer.push(s.gesture)))
  }

  update(world: World, se: SignalEmitter, dt: number): void {
    this.disposalTargets.forEach((id) => {
      world.getEntity(id)?.removeComponent(GestureComponent)
    })
    this.disposalTargets.length = 0

    for (const g of this.gestureBuffer) {
      const targets = world
        .getEntitiesWithComponent(GestureTargetComponent)
        .filter(([_, c]) => c.keys.includes(g.key))

      for (const [t, _] of targets) {
        if (!g.phase || g.phase == GesturePhase.Began) {
          if (t.getBounds().containsPoint(g.startWorldPos.x, g.startWorldPos.y)) {
            t.addComponent(GestureComponent).setGesture(g)
          }
        }
        if (!g.phase || g.phase == GesturePhase.Ended) {
          this.disposalTargets.push(t.id)
        }
      }
    }
    this.gestureBuffer.length = 0
  }
}
