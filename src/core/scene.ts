import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Component } from './component'

export class Scene {
  isPaused = false

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
      this.onResize?.()
    })

    this.onResize?.()
  }

  draw(): void {
    Object.values(this.entities).forEach((e) => e.draw?.(this.viewport))
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isPaused) {
      return
    }

    Object.values(this.entities).forEach((c: Component) => {
      if (!c.isStarted) {
        c.start()
      }
      c.update?.(deltaTime)
    })
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

  onResize?(): void

  private _removeEntity(entity: Component) {
    this.stage.removeChild(entity)
    delete this.entities[entity.id]
  }
}
