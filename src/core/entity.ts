import { Container, Rectangle, type ContainerChild } from 'pixi.js'
import { type Component } from './component'

export class Entity extends Container<ContainerChild> {
  onInit?: (self: Entity) => void
  onStart?: (self: Entity) => void
  onDraw?: (self: Entity, rect: Rectangle) => void
  onUpdate?: (self: Entity, deltaTime: number) => void

  private static nextId = 0
  private readonly _id = Entity.nextId++
  private bounds = new Rectangle()
  private _components = {} as Record<string, Component>
  private _isInit = false
  private _isStarted = false

  get id(): string {
    return this._id.toString()
  }

  get isInit(): boolean {
    return this._isInit
  }

  get isStarted(): boolean {
    return this._isStarted
  }

  private get components(): Component[] {
    return Object.values(this._components)
  }

  init(): void {
    this._isInit = true

    this.components.forEach((c) => {
      c.init()
    })

    this.onInit?.(this)
  }

  start(): void {
    this._isStarted = true

    this.components.forEach((c) => {
      c.start?.()
    })

    this.onStart?.(this)
  }

  draw(rect: Rectangle): void {
    this.bounds = rect

    this.components.forEach((c) => {
      c.draw?.(rect)
    })

    this.onDraw?.(this, rect)
  }

  update(deltaTime: number): void {
    this.components.forEach((c) => {
      c.update(this, deltaTime)
    })

    this.onUpdate?.(this, deltaTime)
  }

  add(component: Component) {
    this._components[typeof component] = component

    if (this.isStarted) {
      component.draw?.(this.bounds)
      component.start?.()
    }
  }

  get(type: string): Component | undefined {
    return this._components[type]
  }

  remove(type: string) {
    if (this._components[type]) {
      delete this._components[type]
    }
  }
}
