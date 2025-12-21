import { Container } from 'pixi.js'
import { Component, Tweener, type SomeComponent } from '.'

export class Entity extends Container {
  private components = new Map<string, Component>()

  constructor(
    public readonly id: number,
    public readonly tag?: string,
  ) {
    super()
  }

  // start?(): void

  // stop() {
  //   Tweener.shared.killTweensOf(this)
  // }

  addComponent<T extends Component>(c: T): Entity {
    this.components.set(c.constructor.name, c)
    return this
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
