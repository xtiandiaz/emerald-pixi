import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Entity } from './entity'

export abstract class Scene {
  isPaused = false

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
  }

  draw(): void {
    this.entities.forEach((e) => e.draw?.(this.bounds))
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isPaused) {
      return
    }

    this.entities.forEach((e) => {
      e.update(deltaTime)
    })
  }

  resize(bounds: Rectangle): void {
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
