import { System, ECS, type GameAppOptions, Scene } from './core'
import { PhysicsSystem, RenderSystem } from './systems'
import { Ticker } from 'pixi.js'

export interface GameState {
  isPaused: boolean
}

export default class GameApp<State extends GameState> {
  state: State
  protected ecs: ECS
  protected appSystems: System[]
  protected scene?: Scene // TODO Manage
  private renderSystem!: RenderSystem

  protected get systems(): System[] {
    return this.appSystems.concat(this.scene?.systems ?? [])
  }

  constructor(state: State) {
    this.state = state

    this.ecs = new ECS()
    this.appSystems = [new PhysicsSystem()]
  }

  async init(options: GameAppOptions, scene: Scene) {
    this.renderSystem = new RenderSystem(options)
    this.scene = scene

    this.appSystems.push(this.renderSystem)

    for await (const s of this.systems) {
      await s.init?.()
    }

    await this.initScene()

    Ticker.shared.add((t) => {
      this.update(t.deltaTime)
    })
  }

  private async initScene() {
    if (!this.scene) {
      return
    }

    await this.scene.init()

    this.renderSystem.stage = this.scene
  }

  private addNewEntities() {
    if (!this.scene?.addedEntities.length) {
      return
    }
    this.scene.addedEntities.forEach((ae) => {
      if (this.ecs.addEntity(ae)) {
        this.systems.forEach((s) => s.onEntityAdded?.(ae))
      }
    })
    this.scene.addedEntities.length = 0
  }

  private update(dt: number) {
    this.addNewEntities()

    if (!this.state.isPaused) {
      this.ecs.updateSystems(this.systems, dt)
    }
  }
}
