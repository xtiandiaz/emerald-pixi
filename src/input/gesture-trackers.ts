import { type Container, type FederatedPointerEvent } from 'pixi.js'
import { GesturePhase, PointerEventKey } from './types'
import { Gesture, TapGesture, DragGesture, SwipeGesture } from './gestures'

export abstract class GestureTracker<T extends Gesture, U> {
  onGesture?: (g: T) => void
  protected abstract pointerEventsKeys: PointerEventKey[]
  protected gesture?: T
  private onDeinit?: () => void

  constructor(protected options: U) {}

  init(target: Container, options?: Partial<U>) {
    target.interactive = true

    if (options) {
      this.options = { ...options, ...this.options }
    }
    this.pointerEventsKeys.forEach((k) => target.on(k, (e) => this.handlePointerEvent(e)))
    this.onDeinit = () => this.pointerEventsKeys.forEach((k) => target.removeAllListeners(k))
  }

  deinit() {
    this.onDeinit?.()
  }

  protected abstract handlePointerEvent(e: FederatedPointerEvent): void

  protected isWithinDuration(g: Gesture, limit: number): boolean {
    return Date.now() - g.timestamp <= limit
  }

  protected isWithinDistance(g: Gesture, limit: number): boolean {
    return g.worldPos.subtract(g.startWorldPos).magnitudeSquared() <= limit * limit
  }
}

export interface TapTrackerOptions {
  timeLimitMS: number
  distanceLimit: number
}

export class TapGestureTracker extends GestureTracker<TapGesture, TapTrackerOptions> {
  protected pointerEventsKeys: PointerEventKey[] = [PointerEventKey.Down, PointerEventKey.Up]

  constructor() {
    super({
      timeLimitMS: 200,
      distanceLimit: 5,
    })
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
          this.gesture.duration <= this.options.timeLimitMS &&
          this.gesture.distanceSquared <= Math.pow(this.options.distanceLimit, 2)
        ) {
          this.onGesture?.(this.gesture)
        }
        this.gesture = undefined
    }
  }
}

export interface DragTrackerOptions {
  distanceThreshold: number
}

export class DragGestureTracker extends GestureTracker<DragGesture, DragTrackerOptions> {
  protected pointerEventsKeys: PointerEventKey[] = [
    PointerEventKey.Down,
    PointerEventKey.GlobalMove,
    PointerEventKey.Up,
    PointerEventKey.UpOutside,
  ]

  constructor() {
    super({
      distanceThreshold: 0,
    })
  }

  protected handlePointerEvent(e: FederatedPointerEvent): void {
    switch (e.type) {
      case PointerEventKey.Down:
        this.gesture = new DragGesture(GesturePhase.Began, e.global.clone())
        break
      case PointerEventKey.Move:
      case PointerEventKey.Up:
      case PointerEventKey.UpOutside:
        if (!this.gesture) {
          break
        }
        this.gesture.worldPos = e.global

        if (this.gesture.distanceSquared >= Math.pow(this.options.distanceThreshold, 2)) {
          this.onGesture?.(this.gesture)
        }
        if (e.type != PointerEventKey.Move) {
          this.gesture = undefined
        }
        break
    }
  }
}

export interface SwipeTrackerOptions {}

export class SwipeGestureTracker extends GestureTracker<SwipeGesture, SwipeTrackerOptions> {
  protected pointerEventsKeys: PointerEventKey[] = [
    PointerEventKey.Down,
    PointerEventKey.Up,
    PointerEventKey.UpOutside,
  ]

  constructor() {
    super({})
  }

  protected handlePointerEvent(e: FederatedPointerEvent): void {}
}
