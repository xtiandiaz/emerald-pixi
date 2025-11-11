import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import PixiPlugin from 'gsap/PixiPlugin'

export type Ease = gsap.EaseString | gsap.EaseFunction

export class Tweener {
  private static _main?: Tweener

  private constructor() {
    gsap.registerPlugin(PixiPlugin)
    PixiPlugin.registerPIXI(PIXI)
  }

  static get main(): Tweener {
    if (this._main == undefined) {
      this._main = new Tweener()
    }

    return this._main
  }

  to(target: PIXI.Container, vars: PixiPlugin.Vars, ease: Ease, duration: number) {
    return gsap.to(target, { pixi: vars, ease, duration })
  }

  async toAsync(target: PIXI.Container, vars: PixiPlugin.Vars, ease: Ease, duration: number) {
    const tw = gsap.to(target, { pixi: vars, ease, duration })

    return new Promise<gsap.core.Tween>((resolve) => {
      tw.vars.onComplete = () => {
        resolve(tw)
      }
    })
  }
}
