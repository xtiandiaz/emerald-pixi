import type { Point } from 'pixi.js'
import type { Direction, Vector } from '../core'
import { GestureKey, GestureState } from './types'

export abstract class Gesture {
  constructor(public key: GestureKey) {}
}

export class DragGesture extends Gesture {
  constructor(
    public move: Vector,
    public state: GestureState,
    public worldPos: Point,
    public worldStartPos: Point,
  ) {
    super(GestureKey.Drag)
  }
}

export class SwipeGesture extends Gesture {
  constructor(
    public direction: Direction,
    public worldStartPos: Point,
  ) {
    super(GestureKey.Swipe)
  }
}
