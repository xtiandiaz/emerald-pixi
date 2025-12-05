import { Direction, Signal, Vector } from '../core'
import type { Point } from 'pixi.js'
import { type GestureStep, GestureKey } from '../input'

export class GestureSignal extends Signal {
  constructor(public key: GestureKey) {
    super()
  }
}

export class DragGestureSignal extends GestureSignal {
  constructor(
    public step: GestureStep,
    public startPos: Point,
    public pos: Point,
    public movement: Vector,
  ) {
    super(GestureKey.Drag)
  }
}

export class SwipeGestureSignal extends GestureSignal {
  constructor(public direction: Direction) {
    super(GestureKey.Swipe)
  }
}
