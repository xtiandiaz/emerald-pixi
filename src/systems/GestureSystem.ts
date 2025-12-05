import { Container } from 'pixi.js'
import { Entity, World, System, type SignalBus, type SignalEmitter } from '../core'
import { GestureComponent } from '../components'
import {
  EntityAddedSignal,
  EntityRemovedSignal,
  DragGestureSignal,
  SwipeGestureSignal,
} from '../signals'
import { GestureKey, GestureTracker, type DragGestureData, type Gesture } from '../input'
import 'pixi.js/math-extras'

export default class GestureSystem extends System {
  private trackerIndex = new Map<number, GestureTracker>()

  constructor(
    private stage: Container,
    public gestures: GestureKey[],
  ) {
    super()
  }

  init(world: World, sbe: SignalBus & SignalEmitter): void {
    this.disconnectables.push(
      sbe.connect(EntityAddedSignal, (s) => this.onEntityAdded(world.getEntity(s.entityId)!, sbe)),
      sbe.connect(EntityRemovedSignal, (s) =>
        this.onEntityRemoved(world.getRemovedEntity(s.entityId)!),
      ),
    )
  }

  private onEntityAdded(entity: Entity, se: SignalEmitter): void {
    const gc = entity.getComponent(GestureComponent)
    if (gc && gc.gestures.length > 0) {
      const tracker = new GestureTracker(entity, gc.gestures, (g) => this.emitGesture(g, se))
      this.trackerIndex.set(entity.id, tracker)
      tracker.init()
    }
  }

  private onEntityRemoved(entity: Entity): void {
    this.trackerIndex.get(entity.id)?.deinit()
    this.trackerIndex.delete(entity.id)
  }

  private emitGesture<T>(g: Gesture<T>, se: SignalEmitter) {
    switch (g.key) {
      case GestureKey.Drag:
        se.emit(new DragGestureSignal(g.targetId, g.data as DragGestureData))
        break
    }
  }
}
