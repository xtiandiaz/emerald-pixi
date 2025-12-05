import { Application, Ticker, type ApplicationOptions } from 'pixi.js'
import { System, Scene, Screen, World, type SomeSystem } from '../core'
import { SignalController } from '../controllers'
import { EntityAddedSignal, EntityRemovedSignal, ScreenResizeSignal } from '../signals'
import { type GameState } from './'

export default abstract class GameApp extends Application {
  protected abstract systems: System[]
  protected readonly world = new World()
  protected readonly signalController = new SignalController()
  protected scene?: Scene

  constructor(
    public state: GameState,
    private scenes: Scene[],
  ) {
    super()

    this.stage.addChild(this.world)
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    await super.init(options)

    this.world.onEntityAdded = (id) => this.signalController.emit(new EntityAddedSignal(id))
    this.world.onEntityRemoved = (id) => this.signalController.emit(new EntityRemovedSignal(id))

    this.systems.forEach((s) => s.init?.(this.world, this.signalController))

    this.ticker.add(this.update, this)

    this.renderer.on('resize', this.updateScreen, this)
    this.updateScreen()
  }

  deinit() {
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

    this.scene?.deinit()
    this.scene = nextScene
  }

  protected getSystem<T extends System>(type: SomeSystem<T>): T | undefined {
    return this.systems.find((s) => s instanceof type) as T
  }

  private update(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.signalController.processSignals()

    this.world.disposeOfRemovedEntities()

    this.systems.concat(this.scene?.systems ?? []).forEach((s) => {
      s.update?.(this.world, this.signalController, ticker.deltaTime)
    })
  }

  private updateScreen() {
    Screen._width = this.renderer.width
    Screen._height = this.renderer.height

    this.signalController.emit(new ScreenResizeSignal(this.renderer.width, this.renderer.height))

    this.stage.hitArea = this.screen
  }
}
