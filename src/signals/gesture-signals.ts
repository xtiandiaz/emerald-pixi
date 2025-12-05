import { Signal } from '../core'
import { GestureKey, type DragGestureData, type SwipeGestureData } from '../input'

export class GestureSignal<T> extends Signal {
  constructor(
    public key: GestureKey,
    public targetId: number,
    public data: T,
  ) {
    super()
  }
}
export class DragGestureSignal extends GestureSignal<DragGestureData> {
  constructor(targetId: number, data: DragGestureData) {
    super(GestureKey.Drag, targetId, data)
  }
}
export class SwipeGestureSignal extends GestureSignal<SwipeGestureData> {
  constructor(targetId: number, data: SwipeGestureData) {
    super(GestureKey.Swipe, targetId, data)
  }
}
