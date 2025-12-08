import { Container } from 'pixi.js'
import { Component, type SomeComponent } from './'

export class Entity extends Container {
  private static nextId = 0
  readonly id: number
  private components = new Map<string, Component>()

  constructor(public readonly tag?: string) {
    super()

    this.id = ++Entity.nextId
  }

  addComponent<T extends Component>(type: SomeComponent<T>, ...args: any): T {
    const component = new type(...args)
    this.components.set(type.name, component)
    return component
  }

  removeComponent<T extends Component>(type: SomeComponent<T>): boolean {
    return this.components.delete(type.name)
  }

  hasComponent<T extends Component>(type: SomeComponent<T>): boolean {
    return this.components.has(type.name)
  }

  getComponent<T extends Component>(type: SomeComponent<T>): T | undefined {
    return this.components.get(type.name) as T
  }
}
