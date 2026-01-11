import { Application, Ticker } from 'pixi.js'
import { type FixedTime, type GameOptions, type GameState } from '.'
import { Scene, Screen, World, type SignalBus, type Disconnectable, clamp } from '../core'
import { SignalController } from '../controllers'
import { ScreenResized } from '../signals'

export class Game<State extends GameState> extends Application {
  protected readonly world = new World()
  protected readonly signalController = new SignalController()
  protected scene?: Scene
  private fixedTime: FixedTime = {
    step: 1 / 60,
    reserve: 0,
  }
  private connections: Disconnectable[] = []

  constructor(
    public state: State,
    private scenes: Scene[],
  ) {
    super()

    this.stage.addChild(this.world)
  }

  async init(options: Partial<GameOptions>, startScene?: string): Promise<void> {
    await super.init(options)

    this.connections.push(...(this.connect?.(this.signalController) ?? []))

    this.ticker.add(this.fixedUpdate, this)
    this.ticker.add(this.update, this)

    this.renderer.on('resize', this.updateScreen, this)
    this.updateScreen()

    if (startScene) {
      await this.switchToScene(startScene)
    }
  }

  connect?(signalBus: SignalBus): Disconnectable[]

  deinit() {
    this.connections.forEach((d) => d.disconnect())
    this.connections.length = 0

    this.ticker.remove(this.update, this)
    this.renderer.off('resize', this.updateScreen, this)

    this.scene?.deinit()
    this.scene = undefined
  }

  async switchToScene(name: string) {
    const nextScene = this.scenes.find((s) => s.name == name)
    if (!nextScene) {
      return
    }

    await nextScene.init(this.world, this.signalController)

    if (this.scene) {
      this.scene.deinit()
    }

    this.scene = nextScene
  }

  private fixedUpdate(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.fixedTime.reserve = clamp(this.fixedTime.reserve + ticker.deltaMS, 0, 0.1)

    while (this.fixedTime.reserve >= this.fixedTime.step) {
      this.scene?.systems.forEach((s) => {
        s.fixedUpdate?.(this.world, this.signalController, this.fixedTime.step)
      })

      this.fixedTime.reserve -= this.fixedTime.step
    }
  }

  private update(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.signalController.emitQueuedSignals()

    this.scene?.systems.forEach((s) => {
      s.update?.(this.world, this.signalController, ticker.deltaTime)
    })

    this.signalController.emitQueuedSignals()
  }

  private updateScreen() {
    Screen._w = this.renderer.width
    Screen._h = this.renderer.height

    this.signalController.queue(new ScreenResized(Screen._w, Screen._h))
  }
}
