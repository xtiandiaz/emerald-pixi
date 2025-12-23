import { Container, type ContainerChild } from 'pixi.js'
import { Component, type SomeComponent } from '.'
import { ContainerChildComponent } from '../components/ContainerChildComponent'

export class Entity extends Container {
  private components = new Map<string, Component>()

  constructor(
    public readonly id: number,
    public readonly tag?: string,
  ) {
    super()
  }

  addComponent<T extends Component>(component: T): Entity {
    this.components.set(component.constructor.name, component)
    return this
  }
  addContainerChildComponent<T extends ContainerChildComponent<U>, U extends ContainerChild>(
    component: T,
  ): Entity {
    this.addChild(component.body)
    return this.addComponent(component)
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
