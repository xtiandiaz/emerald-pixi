import { Signal } from '../core'
import { Gesture } from '../input'

export default class GestureSignal<T extends Gesture> extends Signal {
  constructor(public gesture: T) {
    super()
  }
}
