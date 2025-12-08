import type { Container } from 'pixi.js'
import { Component } from '../core'
import {
  DragGesture,
  DragGestureTracker,
  GestureKey,
  GestureTracker,
  SwipeGesture,
  SwipeGestureTracker,
  TapGesture,
  TapGestureTracker,
  type DragTrackerOptions,
  type Gesture,
  type SwipeTrackerOptions,
  type TapTrackerOptions,
} from '../input'

export class GestureTargetComponent extends Component {
  constructor(public readonly keys: GestureKey[]) {
    super()
  }
}

export class GestureComponent<T extends Gesture, U> extends Component {
  onGesture?: (g: T) => void

  protected constructor(private tracker: GestureTracker<T, U>) {
    super()
  }

  init(container: Container): void {
    this.tracker.init(container)
    this.tracker.onGesture = (g) => this.onGesture?.(g)
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
