import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Entity } from './entity'

export class Scene {
  isPaused = false

  onInit?: (self: Scene) => void
  onStart?: (self: Scene) => void
  onDraw?: (self: Scene) => void
  onUpdate?: (self: Scene, deltaTime: number) => void
  onResize?: (self: Scene) => void

  private app!: Application
  private entities = {} as Record<string, Entity>
  private isStarted = false

  constructor() {
    this.app = new Application()
  }

  get viewport(): Rectangle {
    return this.app.screen
  }

  get stage(): Container {
    return this.app.stage
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

    Object.values(this.entities).forEach((c: Entity) => {
      c.start?.()
    })

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime)
    })

    this.app.renderer.addListener('resize', () => {
      this.onResize?.(this)
    })

    this.onStart?.(this)
  }

  draw(): void {
    Object.values(this.entities).forEach((e) => e.draw?.(this.viewport))

    this.onDraw?.(this)
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isPaused) {
      return
    }

    Object.values(this.entities).forEach((e) => {
      e.update(deltaTime)
    })

    this.onUpdate?.(this, deltaTime)
  }

  add(entity: Entity) {
    this.entities[entity.id] = entity
    this.stage.addChild(entity)

    if (!entity.isInit) {
      entity.init()
    }

    if (!entity.isStarted) {
      entity.draw(this.viewport)
      entity.start()
    }
  }

  remove(entityId: string) {
    const entity = this.entities[entityId]
    if (entity) {
      this._remove(entity)
    }
  }

  async destroy(entityId: string): Promise<void> {
    const entity = this.entities[entityId]
    if (entity) {
      // await entity.onDestroy?.()
      this._remove(entity)
    }
  }

  private _remove(entity: Entity) {
    this.stage.removeChild(entity)
    delete this.entities[entity.id]
  }
}
