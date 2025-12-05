import type { Point } from 'pixi.js'
import type { Direction, Vector } from '../core'

export enum GestureKey {
  Drag = 'DRAG',
  Swipe = 'SWIPE',
}

export enum GestureState {
  Began = 'BEGAN',
  Updated = 'UPDATED',
  Ended = 'ENDED',
}

export interface Gesture<T> {
  key: GestureKey
  data: T
  targetId: number
}

export interface DragGestureData {
  move: Vector
  pos: Point
  startPos: Point
  state: GestureState
}

export interface SwipeGestureData {
  direction: Direction
}
