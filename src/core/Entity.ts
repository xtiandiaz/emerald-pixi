import { Container } from 'pixi.js'
import { Component, type AnyComponent } from './'
import { InputComponent } from '../components'

export default class Entity extends Container {
  readonly id: number

  private static nextId = 0
  private components = new Map<string, Component>()

  constructor() {
    super()

    this.id = ++Entity.nextId
  }

  addComponent<T extends Component>(type: AnyComponent<T>, ...params: any): T {
    const component = new type(...params)
    this.components.set(type.name, component)

    if (component instanceof InputComponent) {
      this.interactive = true
    }

    return component
  }

  getComponent<T extends Component>(type: AnyComponent<T>): T | undefined {
    return this.components.get(type.name) as T
  }

  removeComponent<T extends Component>(type: AnyComponent<T>): boolean {
    return this.components.delete(type.name)
  }

  hasComponent<T extends Component>(type: AnyComponent<T>): boolean {
    return this.components.has(type.name)
  }

  update?(deltaTime: number): void
  _update(deltaTime: number) {
    Object.values(this.components).forEach((c) => {
      c.update?.(deltaTime)
    })
  }
}
