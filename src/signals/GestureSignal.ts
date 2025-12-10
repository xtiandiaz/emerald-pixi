import { Signal } from '../core'
import { type Gesture } from '../input'

export class GestureSignal<T extends Gesture> extends Signal {
  constructor(public gesture: T) {
    super()
  }
}
