import type { Point } from 'pixi.js'
import type { Direction } from '../core'
import { GestureKey, GesturePhase } from './types'

export abstract class Gesture {
  readonly timestamp = Date.now()
  worldPos: Point

  get duration(): number {
    return Date.now() - this.timestamp
  }
  get distanceSquared(): number {
    return this.worldPos.subtract(this.startWorldPos).magnitudeSquared()
  }

  constructor(
    public key: GestureKey,
    public startWorldPos: Point,
    public phase?: GesturePhase,
  ) {
    this.worldPos = startWorldPos.clone()
  }
}

export class TapGesture extends Gesture {
  constructor(public startWorldPos: Point) {
    super(GestureKey.Tap, startWorldPos)
  }
}

export class DragGesture extends Gesture {
  constructor(
    public phase: GesturePhase,
    public startWorldPos: Point,
  ) {
    super(GestureKey.Drag, startWorldPos, phase)
  }
}

export class SwipeGesture extends Gesture {
  constructor(
    public direction: Direction,
    public startWorldPos: Point,
  ) {
    super(GestureKey.Swipe, startWorldPos)
  }
}
