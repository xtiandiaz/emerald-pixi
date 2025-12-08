import { Container } from 'pixi.js'
import { Component, type SomeComponent } from '.'

export class Entity extends Container {
  readonly id: number
  private static nextId = 0
  private components = new Map<string, Component>()

  constructor(public readonly tag?: string) {
    super()

    this.id = ++Entity.nextId
  }

  addComponent<T extends Component>(c: T): T {
    this.components.set(c.constructor.name, c)
    c.init?.(this)
    return c
  }

  removeComponent<T extends Component>(type: SomeComponent<T>): boolean {
    const c = this.getComponent(type)
    if (c) {
      c.deinit?.()
    }
    return this.components.delete(type.name)
  }

  hasComponent<T extends Component>(type: SomeComponent<T>): boolean {
    return this.components.has(type.name)
  }

  getComponent<T extends Component>(type: SomeComponent<T>): T | undefined {
    return this.components.get(type.name) as T
  }
}
