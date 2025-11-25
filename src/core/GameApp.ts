import { Ticker, type ApplicationOptions } from 'pixi.js'
import type { Scene, System } from './'

export default class GameApp {
  isPaused = false
  private scene?: Scene

  async init(scene: Scene, options: Partial<ApplicationOptions>): Promise<void> {
    await scene.init(options)

    this.scene = scene // Refactor

    Ticker.shared.add(() => this.update())
  }

  private update() {
    if (this.isPaused || !this.scene) {
      return
    }

    this.scene?.update()
  }
}
