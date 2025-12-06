import { Entity, System, World, type SignalBus, type SignalEmitter } from '../core'
import { GestureComponent } from '../components'
import { GestureSignal } from '../signals'
import { DragGesture, GestureState, type Gesture } from '../input'

export default class GestureSystem extends System {
  init(world: World, sbe: SignalBus & SignalEmitter): void {
    sbe.connect(GestureSignal, (s) => {
      this.updateComponents(
        world
          .getEntitiesWithComponent(GestureComponent)
          .filter(([_, c]) => c.keys.includes(s.gesture.key)),
        s.gesture,
      )
    })
  }

  private updateComponents(ecs: [Entity, GestureComponent][], g: Gesture) {
    if (g instanceof DragGesture) {
      switch (g.state) {
        case GestureState.Began:
          ecs
            .filter(([e, _]) => e.getBounds().containsPoint(g.worldStartPos.x, g.worldStartPos.y))
            .forEach(([_, c]) => c.gestures.set(g.key, g))
          break
        case GestureState.Updated:
          ecs
            .filter(([_, c]) => c.gestures.has(g.key))
            .forEach(([_, c]) => c.gestures.set(g.key, g))
          break
        case GestureState.Ended:
          ecs.forEach(([_, c]) => c.gestures.delete(g.key))
          break
      }
    }
  }
}
