import type { Container } from 'pixi.js'
import { Component } from '../core'
import {
  GestureTracker,
  TapGestureTracker,
  DragGestureTracker,
  SwipeGestureTracker,
  type Gesture,
  type TapGesture,
  type DragGesture,
  type SwipeGesture,
  type DragTrackerOptions,
  type SwipeTrackerOptions,
  type TapTrackerOptions,
} from '../input'

export class GestureComponent<T extends Gesture, U> extends Component {
  onGesture?: (g: T) => void

  protected constructor(private tracker: GestureTracker<T, U>) {
    super()
  }

  init(container: Container): void {
    this.tracker.init(container, (g) => this.onGesture?.(g))
  }

  deinit(): void {
    this.tracker?.deinit()
  }
}

export class Tapping extends GestureComponent<TapGesture, TapTrackerOptions> {
  constructor() {
    super(new TapGestureTracker())
  }
}

export class Dragging extends GestureComponent<DragGesture, DragTrackerOptions> {
  constructor() {
    super(new DragGestureTracker())
  }
}

export class Swiping extends GestureComponent<SwipeGesture, SwipeTrackerOptions> {
  constructor() {
    super(new SwipeGestureTracker())
  }
}
