import { Application, Ticker, type ApplicationOptions } from 'pixi.js'
import {
  System,
  Scene,
  Screen,
  World,
  type SomeSystem,
  type SignalBus,
  type Disconnectable,
} from '../core'
import { SignalController } from '../controllers'
import { EntityAddedSignal, EntityRemovedSignal, ScreenResizeSignal } from '../signals'
import { type GameState } from './'

export abstract class GameApp<State extends GameState> extends Application {
  protected abstract systems: System[]
  protected readonly world = new World()
  protected readonly signalController = new SignalController()
  protected scene?: Scene
  private disconnectables: Disconnectable[] = []

  constructor(
    public state: State,
    private scenes: Scene[],
  ) {
    super()

    this.stage.addChild(this.world)
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    await super.init(options)

    this.world.onEntityAdded = (id) => this.signalController.emit(new EntityAddedSignal(id))
    this.world.onEntityRemoved = (id) => this.signalController.emit(new EntityRemovedSignal(id))

    this.disconnectables.push(...(this.connect?.(this.signalController) ?? []))

    this.systems.forEach((s) => s.init?.(this.world, this.signalController))

    this.ticker.add(this.update, this)

    this.renderer.on('resize', this.updateScreen, this)
    this.updateScreen()
  }

  connect?(sb: SignalBus): Disconnectable[]

  deinit() {
    this.disconnectables.forEach((d) => d.disconnect())
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
    nextScene.systems.forEach((s) => s.init?.(this.world, this.signalController))

    await nextScene.init(this.world, this.signalController)

    if (this.scene) {
      this.stage.removeChild(this.scene.slate)
      this.scene.deinit()
    }
    this.stage.addChild(nextScene.slate)
    this.scene = nextScene
  }

  protected getSystem<T extends System>(type: SomeSystem<T>): T | undefined {
    return this.systems.find((s) => s instanceof type) as T
  }

  private update(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.signalController.emitQueuedSignals()

    this.systems.concat(this.scene?.systems ?? []).forEach((s) => {
      s.update?.(this.world, this.signalController, ticker.deltaTime)
    })

    this.signalController.emitQueuedSignals()

    this.world.disposeOfRemovedEntities()
  }

  private updateScreen() {
    Screen._w = this.renderer.width
    Screen._h = this.renderer.height

    this.signalController.queue(new ScreenResizeSignal(this.renderer.width, this.renderer.height))

    this.stage.hitArea = this.screen
  }
}
