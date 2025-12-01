import { Direction, Signal } from '../core'
import type { Point } from 'pixi.js'

export abstract class GestureSignal extends Signal {}

export class DragGestureSignal extends GestureSignal {
  constructor(public deltaPos: Point) {
    super()
  }
}

export class SwipeGestureSignal extends GestureSignal {
  constructor(public direction: Direction) {
    super()
  }
}
