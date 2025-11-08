import { Application, Rectangle } from 'pixi.js'
import type { ApplicationOptions, Container, ContainerChild } from 'pixi.js'
import { Component } from './component'

export class Scene {
  isPaused = false

  private _app: Application
  private _entities = {} as Record<string, Component>
  private _isStarted = false

  constructor() {
    this._app = new Application()
  }

  get screen(): Rectangle {
    return this._app.screen
  }

  get stage(): Container<ContainerChild> {
    return this._app.stage
  }

  async init(options?: Partial<ApplicationOptions>): Promise<void> {
    await this._app.init({
      antialias: true,
      ...options,
    })
  }

  start(): void {
    if (this._isStarted) {
      return
    }

    this._isStarted = true

    this.draw()

    Object.values(this._entities).forEach((c: Component) => {
      c.start?.()
    })

    this._app.ticker.add((ticker) => {
      this.update(ticker.deltaTime)
    })

    this._app.renderer.addListener('resize', () => {
      this.onResize?.()
    })

    this.onResize?.()
  }

  draw(): void {
    Object.values(this._entities).forEach((e) => e.draw?.(this.screen))
  }

  update(deltaTime: number): void {
    if (!this._isStarted || this.isPaused) {
      return
    }

    Object.values(this._entities).forEach((c: Component) => {
      if (!c.isStarted) {
        c.start()
      }
      c.update?.(deltaTime)
    })
  }

  addEntity(component: Component) {
    this._entities[component.id] = component
    this._app.stage.addChild(component)

    if (!component.isInit) {
      component.init()
    }
  }

  removeEntity(id: string) {
    const entity = this._entities[id]
    if (entity) {
      this._removeEntity(entity)
    }
  }

  async destroyEntity(id: string): Promise<void> {
    const entity = this._entities[id]
    if (entity) {
      await entity.onDestroy?.()
      this._removeEntity(entity)
    }
  }

  onResize?(): void

  private _removeEntity(entity: Component) {
    this._app.stage.removeChild(entity)
    delete this._entities[entity.id]
  }
}
