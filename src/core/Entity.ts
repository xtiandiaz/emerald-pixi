import { Container } from 'pixi.js'
import { Component, type SomeComponent } from './'

export default class Entity extends Container {
  readonly id: number

  private static nextId = 0
  private components = new Map<string, Component>()

  constructor() {
    super()

    this.id = ++Entity.nextId
  }

  addComponent<T>(type: SomeComponent<T>, ...params: any): T {
    const component = new type(...params)
    this.components.set(type.name, component)

    return component
  }

  removeComponent<T>(type: SomeComponent<T>): boolean {
    return this.components.delete(type.name)
  }

  hasComponent<T>(type: SomeComponent<T>): boolean {
    return this.components.has(type.name)
  }

  getComponent<T>(type: SomeComponent<T>): T | undefined {
    return this.components.get(type.name) as T
  }
}
