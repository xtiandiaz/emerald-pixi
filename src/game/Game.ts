import { Application, Ticker, UPDATE_PRIORITY, type ApplicationOptions } from 'pixi.js'
import { Scene, Screen, World, type SignalBus, type Disconnectable, clamp } from '../core'
import { SignalController } from '../controllers'
import { EntityAdded, EntityRemoved, ScreenResized } from '../signals'
import { type FixedTimeStep, type GameState } from '.'

export interface GameOptions {
  pixelsPerMeter: number
}

export class Game<State extends GameState> extends Application {
  static readonly PPM = 10

  protected readonly world = new World()
  protected readonly signalController = new SignalController()
  protected scene?: Scene
  private connections: Disconnectable[] = []
  private fixedTimeStep!: FixedTimeStep

  constructor(
    public state: State,
    private scenes: Scene[],
  ) {
    super()

    this.stage.scale = Game.PPM

    this.stage.addChild(this.world)
  }

  async init(options: Partial<ApplicationOptions>, startScene?: string): Promise<void> {
    await super.init(options)

    this.fixedTimeStep = {
      step: 1 / this.ticker.FPS,
      accTime: 0,
    }

    this.world.onEntityAdded = (id) => this.signalController.emit(new EntityAdded(id))
    this.world.onEntityRemoved = (id) => this.signalController.emit(new EntityRemoved(id))

    this.connections.push(...(this.connect?.(this.signalController) ?? []))

    this.ticker.add(this.fixedUpdate, this)
    this.ticker.add(this.update, this)

    this.renderer.on('resize', this.updateScreen, this)
    this.updateScreen()

    if (startScene) {
      await this.switchToScene(startScene)
    }
  }

  connect?(sb: SignalBus): Disconnectable[]

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
      this.stage.removeChild(this.scene.hud)
    }
    this.stage.addChild(nextScene.hud)
    this.scene = nextScene
  }

  private fixedUpdate(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.fixedTimeStep.accTime = clamp(this.fixedTimeStep.accTime + ticker.deltaMS, 0, 0.1)

    while (this.fixedTimeStep.accTime >= this.fixedTimeStep.step) {
      this.scene?.systems.forEach((s) => {
        s.fixedUpdate?.(this.world, this.signalController, 10 * this.fixedTimeStep.step)
      })
      this.fixedTimeStep.accTime -= this.fixedTimeStep.step
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

    this.world.disposeOfRemovedEntities()
  }

  private updateScreen() {
    Screen._w = this.renderer.width / Game.PPM
    Screen._h = this.renderer.height / Game.PPM

    this.signalController.queue(new ScreenResized(Screen._w, Screen._h))
  }
}
