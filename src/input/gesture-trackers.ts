import { type Container, type FederatedPointerEvent } from 'pixi.js'
import { GestureKey, GesturePhase, PointerEventKey } from './types'
import { Gesture, TapGesture, DragGesture, SwipeGesture } from './gestures'

export abstract class GestureTracker {
  protected abstract pointerEventsKeys: PointerEventKey[]

  constructor(
    protected target: Container,
    protected onGesture: <T extends Gesture>(g: T) => void,
  ) {}

  init() {
    this.target.interactive = true

    this.pointerEventsKeys.forEach((k) => this.target.on(k, (e) => this.handlePointerEvent(e)))
  }

  deinit() {
    this.pointerEventsKeys.forEach((k) => this.target.removeAllListeners(k))
  }

  protected abstract handlePointerEvent(e: FederatedPointerEvent): void

  protected isWithinDuration(g: Gesture, limit: number): boolean {
    return Date.now() - g.timestamp <= limit
  }

  protected isWithinDistance(g: Gesture, limit: number): boolean {
    return g.worldPos.subtract(g.startWorldPos).magnitudeSquared() <= limit * limit
  }
}

export interface TapGestureOptions {
  timeThresholdMS: number
  distanceLimit: number
}

export class TapGestureTracker extends GestureTracker {
  protected pointerEventsKeys: PointerEventKey[] = [PointerEventKey.Down, PointerEventKey.Up]
  private gesture?: TapGesture

  constructor(
    target: Container,
    onGesture: (g: TapGesture) => void,
    private options: TapGestureOptions = {
      timeThresholdMS: 200,
      distanceLimit: 5,
    },
  ) {
    super(target, onGesture)
  }

  protected handlePointerEvent(e: FederatedPointerEvent): void {
    switch (e.type) {
      case PointerEventKey.Down:
        this.gesture = new TapGesture(e.global.clone())
        break
      case PointerEventKey.Up:
        if (!this.gesture) {
          break
        }
        this.gesture.worldPos = e.global

        if (
          this.isWithinDuration(this.gesture, this.options.timeThresholdMS) &&
          this.isWithinDistance(this.gesture, this.options.distanceLimit)
        ) {
          this.onGesture(this.gesture)
        }
    }
  }
}

export class DragGestureTracker extends GestureTracker {
  protected pointerEventsKeys: PointerEventKey[] = [
    PointerEventKey.Down,
    PointerEventKey.Move,
    PointerEventKey.Up,
    PointerEventKey.UpOutside,
  ]

  protected handlePointerEvent(e: FederatedPointerEvent): void {}
}

export class SwipeGestureTracker extends GestureTracker {
  protected pointerEventsKeys: PointerEventKey[] = [
    PointerEventKey.Down,
    PointerEventKey.Up,
    PointerEventKey.UpOutside,
  ]

  protected handlePointerEvent(e: FederatedPointerEvent): void {}
}
