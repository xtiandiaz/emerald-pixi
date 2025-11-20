import { Container, Rectangle, type ContainerChild } from 'pixi.js'
import type { Component } from './component'

export class Entity extends Container<ContainerChild> {
  onInit?: (self: Entity) => void
  onStart?: (self: Entity) => void
  onDraw?: (self: Entity, bounds: Rectangle) => void
  onUpdate?: (self: Entity, deltaTime: number) => void
  onResize?: (self: Entity, bounds: Rectangle) => void

  private static nextId = 0
  private readonly _id = Entity.nextId++
  private bounds = new Rectangle()
  private _components = {} as Record<string, Component>
  private __isInit = false
  private __isStarted = false

  get id(): string {
    return this._id.toString()
  }

  private get components(): Component[] {
    return Object.values(this._components)
  }

  init?(): void

  start?(): void

  draw(bounds: Rectangle): void {
    this.bounds = bounds

    this.components.forEach((c) => {
      c.draw?.(bounds)
    })

    this.onDraw?.(this, bounds)
  }

  update(deltaTime: number): void {
    this.components.forEach((c) => {
      c.update?.(deltaTime)
    })

    this.onUpdate?.(this, deltaTime)
  }

  resize(bounds: Rectangle): void {
    this.bounds = bounds

    this.onResize?.(this, bounds)
  }

  __init(): void {
    if (this.__isInit) {
      return
    }
    this.__isInit = true

    this.init?.()

    this.onInit?.(this)
  }

  __start(): void {
    if (this.__isStarted) {
      return
    }
    this.__isStarted = true

    this.start?.()

    this.components.forEach((c) => {
      c.__start()
    })

    this.onStart?.(this)
  }

  // --------------------------------
  // COMPONENTS
  // --------------------------------

  addComponent<T extends Component>(type: new () => T) {
    const name = type.name
    const component = new type()
    this._components[name] = component

    component.__init()

    this.addChild(component)

    if (this.__isStarted) {
      component.draw?.(this.bounds)
      component.__start()
    }
  }

  getComponent<T extends Component>(type: new () => T): T | undefined {
    return this._components[type.name] as T
  }

  removeComponent<T extends Component>(type: new () => T): void {
    if (this._components[type.name]) {
      delete this._components[type.name]
    }
  }
}
