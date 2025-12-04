import { World, System, Screen, type SignalBus, type SignalEmitter } from '../core'
import { DragGestureSignal, ScreenResizeSignal, SwipeGestureSignal } from '../signals'
import { Container, FederatedPointerEvent, Rectangle, Point } from 'pixi.js'
import { directionFromMovement } from '../utils'
import 'pixi.js/math-extras'

const SWIPE_MIN_DISTANCE = 20
const SWIPE_MAX_DURATION = 250 // ms

interface Gesture {
  startPoint: Point
  timestamp: number
}

export default class GestureSystem extends System {
  private eventNames = ['pointerdown', 'pointerup', 'pointermove']
  private gesture?: Gesture

  constructor(private stage: Container) {
    super()
  }

  init(world: World, sbe: SignalBus & SignalEmitter): void {
    this.stage.interactive = true

    this.eventNames.forEach((en) =>
      this.stage.on(en, (e) => {
        this.handlePointerEvent(e, sbe)
      }),
    )

    this.disconnectables.push(sbe.connect(ScreenResizeSignal, (_) => this.resetHitArea()))

    this.resetHitArea()
  }

  deinit(): void {
    this.eventNames.forEach((en) => this.stage.removeAllListeners(en))
    this.disconnectables.forEach((d) => d.disconnect())
    this.disconnectables.length = 0
  }

  private handlePointerEvent(e: FederatedPointerEvent, se: SignalEmitter) {
    switch (e.type) {
      case 'pointerdown':
        this.gesture = {
          startPoint: e.global.clone(),
          timestamp: Date.now(),
        }
        break
      case 'pointermove':
        if (this.gesture) {
          se.emit(new DragGestureSignal(e.movement))
        }
        break
      case 'pointerup':
        if (this.gesture) {
          const dp = e.global.subtract(this.gesture.startPoint)
          const dt = Date.now() - this.gesture.timestamp
          if (dt <= SWIPE_MAX_DURATION && dp.magnitude() >= SWIPE_MIN_DISTANCE) {
            se.emit(new SwipeGestureSignal(directionFromMovement(dp)))
          }
        }
        this.gesture = undefined
        break
    }
  }

  private resetHitArea() {
    this.stage.hitArea = new Rectangle(0, 0, Screen.width, Screen.height)
  }
}
