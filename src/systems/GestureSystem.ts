import { Container, FederatedPointerEvent, Rectangle, Point } from 'pixi.js'
import { World, System, Screen, Vector, type SignalBus, type SignalEmitter } from '../core'
import { DragGestureSignal, ScreenResizeSignal, SwipeGestureSignal } from '../signals'
import { GestureKey, GestureStep } from '../input'
import { directionFromMovement } from '../utils'
import 'pixi.js/math-extras'

const SWIPE_MIN_DISTANCE = 20
const SWIPE_MAX_DURATION = 250 // ms

interface GestureState {
  startPos: Point
  pos: Point
  movement: Vector
  timestamp: number
}

export default class GestureSystem extends System {
  private eventNames = ['pointerdown', 'pointerup', 'pointermove']
  private gestureState?: GestureState

  constructor(
    private stage: Container,
    public gestures: GestureKey[],
  ) {
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
        this.gestureState = {
          startPos: e.global.clone(),
          pos: e.global.clone(),
          movement: new Vector(),
          timestamp: Date.now(),
        }
        this.emitStepSignals(GestureStep.Began, se)
        break
      case 'pointermove':
        if (!this.gestureState) {
          break
        }
        this.gestureState.movement.set(e.movementX, e.movementY)
        this.gestureState.pos.set(e.globalX, e.globalY)

        this.emitStepSignals(GestureStep.Updated, se)
        break
      case 'pointerup':
        if (this.gestureState) {
          const dp = e.global.subtract(this.gestureState.startPos)
          const dt = Date.now() - this.gestureState.timestamp
          if (dt <= SWIPE_MAX_DURATION && dp.magnitude() >= SWIPE_MIN_DISTANCE) {
            se.emit(new SwipeGestureSignal(directionFromMovement(dp)))
          }
        }
        this.emitStepSignals(GestureStep.Ended, se)
        this.gestureState = undefined
        break
    }
  }

  private emitStepSignals(step: GestureStep, se: SignalEmitter) {
    if (!this.gestures || !this.gestureState) {
      return
    }
    const gs = this.gestureState

    this.gestures.forEach((key) => {
      switch (key) {
        case GestureKey.Drag:
          se.emit(new DragGestureSignal(step, gs.startPos, gs.pos, gs.movement))
      }
    })
  }

  private resetHitArea() {
    this.stage.hitArea = new Rectangle(0, 0, Screen.width, Screen.height)
  }
}
