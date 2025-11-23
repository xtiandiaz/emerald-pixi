import { Container, Rectangle, type ContainerChild } from 'pixi.js'
import { Body } from 'matter-js'
import { Component } from './components'

type ComponentContainer<T extends Component> = new (container: Container<ContainerChild>) => T

export class Entity extends Container<ContainerChild> {
  __onBodyAdded?: (body: Body) => void

  private static nextId = 0
  private readonly _id = Entity.nextId++
  private _body?: Body
  private _components = {} as Record<string, Component>
  private _isStarted = false

  get id(): string {
    return this._id.toString()
  }

  get body(): Body | undefined {
    return this._body
  }

  private get components(): Component[] {
    return Object.values(this._components)
  }

  init?(): void

  draw?(rect: Rectangle): void
  __draw(rect: Rectangle): void {
    this.draw?.(rect)

    this.components.forEach((c) => {
      c.draw?.(rect)
    })
  }

  start?(): void
  __start(): void {
    if (this._isStarted) {
      return
    }
    this._isStarted = true

    this.start?.()

    this.components.forEach((c) => {
      c.start?.()
    })
  }

  update?(deltaTime: number): void
  __update(deltaTime: number): void {
    if (!this._isStarted) {
      return
    }

    if (this.body) {
      this.position = this.body.position
      this.rotation = this.body.angle
    }

    this.update?.(deltaTime)

    this.components.forEach((c) => {
      c.update?.(deltaTime)
    })
  }

  resize?(rect: Rectangle): void

  // --------------------------------
  // BODY
  // --------------------------------

  addBody(body: Body): Body {
    this._body = body
    this.__onBodyAdded?.(body)

    return body
  }

  // --------------------------------
  // COMPONENTS
  // --------------------------------

  addComponent<T extends Component>(type: ComponentContainer<T>): T {
    const name = type.name
    const component = new type(this)
    this._components[name] = component

    if (this._isStarted) {
      component.start?.()
    }

    return component
  }

  getComponent<T extends Component>(type: ComponentContainer<T>): T | undefined {
    return this._components[type.name] as T
  }

  removeComponent<T extends Component>(type: ComponentContainer<T>): T | undefined {
    const component = this._components[type.name] as T
    if (component) {
      component.end?.()
    }

    delete this._components[type.name]

    return component
  }
}
