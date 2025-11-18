import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Component } from './component'

export class Scene {
  isPaused = false

  onInit?: (self: Scene) => void
  onStart?: (self: Scene) => void
  onDraw?: (self: Scene) => void
  onUpdate?: (self: Scene, deltaTime: number) => void
  onResize?: (self: Scene) => void

  private app!: Application
  private entities = {} as Record<string, Component>
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

    Object.values(this.entities).forEach((c: Component) => {
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

    Object.values(this.entities).forEach((c: Component) => {
      if (!c.isStarted) {
        c.draw(this.viewport)
        c.start()
      }
      c.update(deltaTime)
    })

    this.onUpdate?.(this, deltaTime)
  }

  addEntity(component: Component) {
    this.entities[component.id] = component
    this.stage.addChild(component)

    if (!component.isInit) {
      component.init()
    }
  }

  removeEntity(id: string) {
    const entity = this.entities[id]
    if (entity) {
      this._removeEntity(entity)
    }
  }

  async destroyEntity(id: string): Promise<void> {
    const entity = this.entities[id]
    if (entity) {
      await entity.onDestroy?.()
      this._removeEntity(entity)
    }
  }

  private _removeEntity(entity: Component) {
    this.stage.removeChild(entity)
    delete this.entities[entity.id]
  }
}
