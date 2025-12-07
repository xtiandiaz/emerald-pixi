import type { Point } from 'pixi.js'
import { Component } from '../core'
import { GestureKey, TapGesture, DragGesture, type Gesture } from '../input'

export class GestureTargetComponent extends Component {
  constructor(public readonly keys: GestureKey[]) {
    super()
  }
}

export class GestureComponent extends Component {
  private gestures = new Map<GestureKey, Gesture>()

  getGesture<T extends Gesture>(key: GestureKey): T | undefined {
    return this.gestures.get(key) as T
  }

  setGesture(g: Gesture) {
    this.gestures.set(g.key, g)
  }
}
