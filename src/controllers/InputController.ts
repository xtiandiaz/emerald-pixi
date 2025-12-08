import type { Container } from 'pixi.js'
import {
  DragGestureTracker,
  Gesture,
  GestureKey,
  GestureTracker,
  SwipeGestureTracker,
  TapGestureTracker,
} from '../input'

export class InputController {
  private gestureTrackers = new Map<GestureKey, GestureTracker>()

  trackGesture(key: GestureKey, target: Container, onGesture: <T extends Gesture>(g: T) => void) {
    this.gestureTrackers.get(key)?.deinit()

    const tracker = (() => {
      switch (key) {
        case GestureKey.Tap:
          return new TapGestureTracker(target, onGesture)
        case GestureKey.Drag:
          return new DragGestureTracker(target, onGesture)
        case GestureKey.Swipe:
          return new SwipeGestureTracker(target, onGesture)
      }
    })()

    if (tracker) {
      tracker.init()
      this.gestureTrackers.set(key, tracker)
    }
  }

  deinit() {
    this.gestureTrackers.forEach((gt) => gt.deinit())
  }
}
