import { Component } from '../core'
import type { GestureKey } from '../input'

export default class GestureComponent extends Component {
  constructor(public gestures: GestureKey[]) {
    super()
  }
}
