import { type Container, type FederatedPointerEvent } from 'pixi.js'
import type { Gesture, TapGesture, DragGesture, SwipeGesture } from './gestures'
import { PointerEventKey } from './types'
import { directionFromMovement, distanceSquared, duration } from '../utils'

export abstract class GestureTracker<T extends Gesture, U> {
  onGesture?: (g: T) => void
  protected abstract pointerEventsKeys: PointerEventKey[]
  protected pGesture?: Partial<T>
  private onDeinit?: () => void

  constructor(protected options: U) {}

  init(target: Container, options?: Partial<U>) {
    target.interactive = true

    if (options) {
      this.options = { ...options, ...this.options }
    }
    this.pointerEventsKeys.forEach((k) => target.on(k, (e) => this.handlePointerEvent(k, e)))
    this.onDeinit = () => this.pointerEventsKeys.forEach((k) => target.removeAllListeners(k))
  }

  deinit() {
    this.onDeinit?.()
  }

  protected abstract handlePointerEvent(key: PointerEventKey, e: FederatedPointerEvent): void
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

  protected handlePointerEvent(key: PointerEventKey, e: FederatedPointerEvent): void {
    switch (key) {
      case PointerEventKey.Down:
        this.pGesture = {
          startWorldPos: e.global.clone(),
          timestamp: Date.now(),
        }
        break
      case PointerEventKey.Up:
        if (!this.pGesture) {
          break
        }
        if (
          duration(this.pGesture.timestamp!) <= this.options.timeLimitMS &&
          distanceSquared(this.pGesture.startWorldPos!, e.global) <=
            Math.pow(this.options.distanceLimit, 2)
        ) {
          this.onGesture?.({
            ...this.pGesture,
          } as TapGesture)
        }
        this.pGesture = undefined
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

  protected handlePointerEvent(key: PointerEventKey, e: FederatedPointerEvent): void {
    switch (key) {
      case PointerEventKey.Down:
        this.pGesture = {
          startWorldPos: e.global.clone(),
          timestamp: Date.now(),
        }
        break
      case PointerEventKey.GlobalMove:
      case PointerEventKey.Up:
      case PointerEventKey.UpOutside:
        if (!this.pGesture) {
          break
        }
        this.pGesture.worldPos = e.global

        if (
          this.pGesture.phase ||
          distanceSquared(this.pGesture.startWorldPos!, e.global) >
            Math.pow(this.options.distanceThreshold, 2)
        ) {
          this.pGesture.phase ||= 1
          this.onGesture?.({
            ...this.pGesture,
          } as DragGesture)
        }
        if (key != PointerEventKey.GlobalMove) {
          this.pGesture = undefined
        }
        break
    }
  }
}

export interface SwipeTrackerOptions {
  distanceThreshold: number
  timeLimitMS: number
}

export class SwipeGestureTracker extends GestureTracker<SwipeGesture, SwipeTrackerOptions> {
  protected pointerEventsKeys: PointerEventKey[] = [
    PointerEventKey.Down,
    PointerEventKey.Up,
    PointerEventKey.UpOutside,
  ]

  constructor() {
    super({
      distanceThreshold: 20,
      timeLimitMS: 250,
    })
  }

  protected handlePointerEvent(key: PointerEventKey, e: FederatedPointerEvent): void {
    switch (key) {
      case PointerEventKey.Down:
        this.pGesture = {
          startWorldPos: e.global.clone(),
          timestamp: Date.now(),
        }
        break
      case PointerEventKey.Up:
      case PointerEventKey.UpOutside:
        if (!this.pGesture) {
          break
        }
        if (
          duration(this.pGesture.timestamp!) <= this.options.timeLimitMS &&
          distanceSquared(this.pGesture.startWorldPos!, e.global) >
            Math.pow(this.options.distanceThreshold, 2)
        ) {
          this.onGesture?.({
            ...this.pGesture,
            direction: directionFromMovement(e.global.subtract(this.pGesture.startWorldPos!)),
          } as SwipeGesture)
        }
        this.pGesture = undefined
    }
  }
}
