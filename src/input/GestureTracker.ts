import { Point, type Container, type FederatedPointerEvent } from 'pixi.js'
import { GestureKey, GestureState, type DragGestureData, type Gesture } from './types'
import { Vector } from '../core'

interface GestureTarget extends Container {
  id: number
}

const SWIPE_MIN_DISTANCE = 20
const SWIPE_MAX_DURATION = 250 // ms

interface GestureAttempt {
  move: Vector
  pos: Point
  startPos: Point
  timestamp: number
}

export default class GestureTracker {
  private pointerEventNames = ['pointerdown', 'pointermove', 'pointerup', 'pointerupoutside']
  private keys: Set<GestureKey>
  private attempt?: GestureAttempt

  constructor(
    private target: GestureTarget,
    aims: GestureKey[],
    private onGesture: <T>(g: Gesture<T>) => void,
  ) {
    this.keys = new Set(aims)
  }

  init() {
    this.target.interactive = true

    this.pointerEventNames.forEach((en) => this.target.on(en, (e) => this.handlePointerEvent(e)))
  }

  deinit() {
    this.pointerEventNames.forEach((en) => this.target.removeAllListeners(en))
  }

  private handlePointerEvent(e: FederatedPointerEvent) {
    switch (e.type) {
      case 'pointerdown':
        this.attempt = {
          move: e.movement.clone(),
          startPos: e.global.clone(),
          pos: e.global.clone(),
          timestamp: Date.now(),
        }
        this.sendTrackedGestures(GestureState.Began, e)
        break
      case 'pointermove':
        if (!this.attempt) {
          break
        }
        this.attempt.move.set(e.movementX, e.movementY)
        this.attempt.pos.set(e.globalX, e.globalY)
        this.sendTrackedGestures(GestureState.Updated, e)
        break
      case 'pointerup':
      case 'pointerupoutside':
        this.attempt!.move.set(e.movementX, e.movementY)
        this.attempt!.pos.set(e.globalX, e.globalY)
        this.sendTrackedGestures(GestureState.Ended, e)
        this.attempt = undefined

        // if (this.gestureState) {
        //   const dp = e.global.subtract(this.gestureState.startPos)
        //   const dt = Date.now() - this.gestureState.timestamp
        //   if (dt <= SWIPE_MAX_DURATION && dp.magnitude() >= SWIPE_MIN_DISTANCE) {
        //     // se.emit(new SwipeGestureSignal(directionFromMovement(dp)))
        //   }
        // }
        break
    }
  }

  private sendTrackedGestures(state: GestureState, e: FederatedPointerEvent) {
    if (!this.attempt) {
      return
    }
    Array.from(this.keys).forEach((key) => {
      switch (key) {
        case GestureKey.Drag:
          this.onGesture<DragGestureData>({
            key,
            targetId: this.target.id,
            data: { state, ...this.attempt! },
          })
          break
      }
    })
  }
}
