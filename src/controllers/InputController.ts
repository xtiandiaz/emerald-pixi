import type { Container } from 'pixi.js'
import { Gesture, GestureTracker, type GestureKey } from '../input'

export default class InputController {
  private gestureTracker?: GestureTracker

  trackGestures(
    keys: GestureKey[],
    slate: Container,
    onGesture: <T extends Gesture>(g: T) => void,
  ) {
    this.gestureTracker?.deinit()
    this.gestureTracker = new GestureTracker(keys, slate, onGesture)
    this.gestureTracker!.init()
  }
}
