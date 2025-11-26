import { Application, Rectangle, type ApplicationOptions } from 'pixi.js'
import { Entity, type System } from './'
import { PhysicsSystem, RenderSystem } from '../systems'
import type { GameState } from '../state/GameState'

export default class Scene extends Application {
  private static _bounds = new Rectangle()
  private entities = {} as Record<number, Entity>
  private systems: System[] = []
  private state: GameState

  constructor(state: GameState) {
    super()

    this.state = state
  }

  static get bounds(): Rectangle {
    return Scene._bounds
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    await super.init(options)

    this.systems.push(new PhysicsSystem(), new RenderSystem(this.renderer, this.stage))

    this.ticker.add(() => {
      this.update()
    })

    this.renderer.on('resize', () => {
      this.onResize()
    })
    this.onResize()
  }

  update() {
    if (this.state.isPaused) {
      return
    }
    const es = Object.values(this.entities)
    this.systems.forEach((s) => s.update(es))
  }

  addEntity(entity: Entity) {
    this.entities[entity.id] = entity
  }

  removeEntity(entityId: number) {
    delete this.entities[entityId]
  }

  private onResize() {
    Scene._bounds = new Rectangle(0, 0, this.screen.width, this.screen.height)
  }
}
