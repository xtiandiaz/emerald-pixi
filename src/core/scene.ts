import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Entity } from './entity'

export class Scene {
  isPaused = false

  onInit?: (self: Scene) => void
  onStart?: (self: Scene) => void
  onDraw?: (self: Scene) => void
  onUpdate?: (self: Scene, deltaTime: number) => void
  onResize?: (self: Scene, bounds: Rectangle) => void

  private app!: Application
  private isStarted = false
  private _entities = {} as Record<string, Entity>

  constructor() {
    this.app = new Application()
  }

  get bounds(): Rectangle {
    return this.app.screen
  }

  get stage(): Container {
    return this.app.stage
  }

  private get entities(): Entity[] {
    return Object.values(this._entities)
  }

  async init(options?: Partial<ApplicationOptions>): Promise<void> {
    await this.app.init({
      antialias: true,
      ...options,
    })

    this.onInit?.(this)
  }

  start(): void {
    if (this.isStarted) {
      return
    }
    this.isStarted = true

    this.draw()

    this.entities.forEach((c: Entity) => {
      c.__start()
    })

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime)
    })

    this.app.renderer.addListener('resize', () => {
      this.resize(this.bounds)
    })

    this.onStart?.(this)
  }

  draw(): void {
    this.entities.forEach((e) => e.draw?.(this.bounds))

    this.onDraw?.(this)
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isPaused) {
      return
    }

    this.entities.forEach((e) => {
      e.update(deltaTime)
    })

    this.onUpdate?.(this, deltaTime)
  }

  resize(bounds: Rectangle): void {
    this.onResize?.(this, bounds)

    this.entities.forEach((e) => {
      e.resize?.(bounds)
    })
  }

  // --------------------------------
  // ENTITIES
  // --------------------------------

  addEntity(entity: Entity) {
    this._entities[entity.id] = entity

    entity.__init()

    this.stage.addChild(entity)

    if (this.isStarted) {
      entity.draw(this.bounds)
      entity.__start()
    }
  }

  removeEntity(entityId: string) {
    const entity = this._entities[entityId]
    if (entity) {
      this.stage.removeChild(entity)
      delete this._entities[entity.id]
    }
  }
}
