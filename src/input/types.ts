import type { Point } from 'pixi.js'
import type { Direction, Vector } from '../core'
import type { Gesture } from './gestures'

export enum GestureKey {
  Drag = 'DRAG',
  Swipe = 'SWIPE',
}

export enum GestureState {
  Began = 'BEGAN',
  Updated = 'UPDATED',
  Ended = 'ENDED',
}

export type SomeGesture<T extends Gesture> = new (...args: any[]) => T
