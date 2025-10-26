import { Application, Container, Rectangle } from 'pixi.js'
import type { ApplicationOptions, ContainerChild } from 'pixi.js'
import { Component } from './component'
import { Tweener } from './tweener'

export abstract class Scene<Options extends object> {
  readonly options: Options
  readonly tweener: Tweener

  _app: Application
  _entities = {} as Record<string, Component>

  _hasStarted = false

  constructor(options: Options) {
    this.options = options
    this.tweener = new Tweener()

    this._app = new Application()
  }

  get screen(): Rectangle {
    return this._app.screen
  }

  get stage(): Container<ContainerChild> {
    return this._app.stage
  }

  async init(options: Partial<ApplicationOptions>) {
    await this._app.init({
      ...options,
      antialias: true,
      resizeTo: window,
    })

    document.body.appendChild(this._app.canvas)

    this._app.renderer.addListener('resize', () => this.onResize?.())
  }

  start(): void {
    if (this._hasStarted) {
      return
    }

    this._app.ticker.add((time) => {
      this.update(time.deltaTime)
    })

    this._hasStarted = true
  }

  update(deltaTime: number): void {
    this.tweener.update()

    Object.values(this._entities).forEach((c: Component) => {
      c.update?.(deltaTime)
    })
  }

  add(component: Component): string {
    const id = Symbol().toString()
    component.id = id
    this._entities[id] = component
    this.stage.addChild(component)
    return id
  }

  async destroy(id: string): Promise<boolean> {
    const entity = this._entities[id]
    if (entity) {
      await entity.onDestroy?.()
      this.stage.removeChild(entity)
      delete this._entities[id]
    }
    return entity != undefined
  }

  onResize?(): void
}
