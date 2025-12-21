import * as PIXI from 'pixi.js'
import GSAP from 'gsap'
import PixiPlugin from 'gsap/PixiPlugin'

// export type Ease = gsap.EaseString | gsap.EaseFunction

// declare namespace GSAP {
//   interface Timeline {
//     pixiTo: (
//       target: PIXI.Container,
//       vars: PixiPlugin.Vars,
//       ease: Ease,
//       duration: number,
//     ) => gsap.core.Tween
//   }
// }

// GSAP.core.Timeline.prototype.pixiTo = function (this) {}

export interface PixiTweenParams extends gsap.TweenVars {
  vars: PixiPlugin.Vars
  startVars?: PixiPlugin.Vars
}

export class Tweener {
  private static sharedInstance?: Tweener

  constructor() {
    GSAP.registerPlugin(PixiPlugin)
    PixiPlugin.registerPIXI(PIXI)
  }

  static get shared(): Tweener {
    if (!this.sharedInstance) {
      this.sharedInstance = new Tweener()
    }
    return this.sharedInstance
  }

  timeline(): gsap.core.Timeline {
    return GSAP.timeline()
  }

  to(target: PIXI.Container, params: PixiTweenParams) {
    return GSAP.to(target, { pixi: params.vars, startAt: { pixi: params.startVars }, ...params })
  }

  async toAsync(target: PIXI.Container, params: PixiTweenParams) {
    const tw = this.to(target, params)

    return new Promise<gsap.core.Tween>((resolve) => {
      tw.vars.onComplete = () => {
        resolve(tw)
      }
    })
  }

  killTweensOf(target: PIXI.Container) {
    GSAP.killTweensOf(target)
  }
}
