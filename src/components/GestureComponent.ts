import { Component } from '../core'
import { GestureKey, type Gesture, type SomeGesture } from '../input'

export default class GestureComponent extends Component {
  constructor(
    public readonly keys: GestureKey[],
    public readonly gestures = new Map<GestureKey, Gesture>(),
  ) {
    super()
  }

  getGesture<T extends Gesture>(key: GestureKey): T | undefined {
    return this.gestures.get(key) as T
  }
}
