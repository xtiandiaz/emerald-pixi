import { Direction, Signal } from '../core'
import type { Point } from 'pixi.js'

export class DragGestureSignal extends Signal {
  constructor(public movement: Point) {
    super()
  }
}

export class SwipeGestureSignal extends Signal {
  constructor(public direction: Direction) {
    super()
  }
}
