import { Application, Container, Rectangle } from 'pixi.js'
import type { ApplicationOptions, ContainerChild } from 'pixi.js'
import { Component } from './component'

export abstract class Scene<Options extends object> {
  readonly options: Options

  _app = new Application()
  _entities = {} as Record<string, Component>

  _hasStarted = false

  constructor(options: Options) {
    this.options = options
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

  add(component: Component): string {
    const id = Symbol().toString()
    component.id = id
    this._entities[id] = component
    this.stage.addChild(component.container)
    return id
  }

  update(deltaTime: number): void {
    Object.values(this._entities).forEach((c: Component) => {
      c.update(deltaTime)
    })
  }
}
