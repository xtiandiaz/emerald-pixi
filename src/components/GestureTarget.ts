import type { Point } from 'pixi.js'
import { Component } from '../core'
import type { GestureKey } from '../input'

export class GestureTarget extends Component {
  dragPosition?: Point

  constructor(public gestures: GestureKey[]) {
    super()
  }
}
