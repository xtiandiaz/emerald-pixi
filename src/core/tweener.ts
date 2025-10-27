import { lerp } from './utils'
import type { Component } from './component'
import { Ticker } from 'pixi.js'

export interface Tween {
  target: Component
  destination: any
  startValue: any
  duration: number
  startTime: number
  ease: (t: number) => number

  setValue: (v: any) => void
  onUpdate?: (t: number) => void
  onCompleted?: () => void
}

export class Ease {
  private constructor() {}

  static BackOut = (amount: number) => {
    return (t: number) => --t * t * ((amount + 1) * t + amount) + 1
  }

  static Linear = (t: number) => t
}

export class Tweener {
  private static _shared?: Tweener
  private tweening: Tween[] = []

  private constructor() {}

  static get shared(): Tweener {
    if (this._shared == undefined) {
      this._shared = new Tweener()
      Ticker.shared.add(() => this._shared!.update())
    }

    return this._shared
  }

  async tween<T extends Component>(
    target: T,
    property: string,
    destination: any,
    duration: number,
    easing: (t: number) => number,
    onUpdate?: (t: number) => void,
  ) {
    const propKey = property as keyof typeof target

    const tw: Tween = {
      target,
      destination,
      duration: duration * 1000,
      ease: easing,
      startValue: target[propKey],
      startTime: Date.now(),

      setValue: (v) => {
        ;(target[propKey] as any) = v
      },
      onUpdate,
    }

    this.tweening.push(tw)

    return new Promise<void>((resolve) => {
      tw.onCompleted = () => {
        resolve()
      }
    })
  }

  update() {
    const now = Date.now()
    const completedTweensIndices: number[] = []

    for (let i = 0; i < this.tweening.length; i++) {
      const tw = this.tweening[i]!
      const t = Math.min(1, (now - tw.startTime) / tw.duration)
      const value = lerp(tw.startValue, tw.destination, tw.ease(t))

      tw.setValue(value)
      tw.onUpdate?.(t)

      if (t === 1) {
        tw.setValue(tw.destination)
        tw.onCompleted?.()
        completedTweensIndices.push(i)
      }
    }

    for (const index of completedTweensIndices) {
      this.tweening.splice(index, 1)
    }
  }
}
