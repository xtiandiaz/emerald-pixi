import type { Point } from 'pixi.js'
import type { Direction } from '../core'

export interface Gesture {
  startWorldPos: Point
  timestamp: number
  phase?: number
}

export interface TapGesture extends Gesture {}

export interface DragGesture extends Gesture {
  worldPos: Point
}

export interface SwipeGesture extends Gesture {
  direction: Direction
}
