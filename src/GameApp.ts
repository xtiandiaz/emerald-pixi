import { Application, Ticker, type ApplicationOptions } from 'pixi.js'
import { System, Scene, Screen } from './core'
import { EntityManager, SignalManager } from './managers'
import { PhysicsSystem } from './systems'

export interface GameState {
  isPaused: boolean
}

export default class GameApp<State extends GameState> extends Application {
  protected baseSystems: System[]
  private entityManager: EntityManager
  private signalManager: SignalManager
  private scene?: Scene

  protected get allSystems(): System[] {
    return this.baseSystems.concat(this.scene?.systems ?? [])
  }

  constructor(
    public state: State,
    protected scenes: Scene[],
  ) {
    super()

    this.baseSystems = [new PhysicsSystem()]
    this.entityManager = new EntityManager()
    this.signalManager = new SignalManager()
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    await super.init(options)

    this.updateScreen()

    for (const s of this.baseSystems) {
      s.init?.()
    }
    await this.initScene(this.scenes[0]!)

    this.ticker.add(this.update, this)
    this.renderer.on('resize', this.updateScreen, this)
  }

  deinit() {
    this.ticker.remove(this.update, this)
    this.renderer.off('resize', this.updateScreen, this)

    this.deinitScene()

    this.entityManager.clear()
    this.signalManager.clear()
    this.allSystems.forEach((s) => s.deinit())
  }

  private async initScene(scene: Scene) {
    await scene.init()

    this.deinitScene()

    scene.entities.forEach((e) => {
      if (this.entityManager.addEntity(e)) {
        this.allSystems.forEach((s) => s.onEntityAdded?.(e))
      }
    })
    this.stage.addChild(scene)
    this.scene = scene
  }

  private deinitScene() {
    if (!this.scene) {
      return
    }
    this.scene.entities.forEach((e) => {
      if (this.entityManager.removeEntity(e.id)) {
        this.allSystems.forEach((s) => s.onEntityRemoved?.(e))
      }
    })
    this.stage.removeChild(this.scene)
    this.scene = undefined
  }

  private update(ticker: Ticker) {
    if (this.state.isPaused) {
      return
    }
    this.allSystems.forEach((s) =>
      s.update(this.entityManager, this.signalManager, ticker.deltaTime),
    )
    this.signalManager.connectSignals(this.entityManager)
  }

  private updateScreen() {
    Screen._width = this.renderer.width
    Screen._height = this.renderer.height
  }
}
