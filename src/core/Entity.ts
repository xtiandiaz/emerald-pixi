import { Container } from 'pixi.js'
import { type Component } from './'

export default class Entity extends Container {
  readonly id: number

  private static nextId = 0
  private components = {} as Record<string, object>

  constructor() {
    super()

    this.id = Entity.nextId++
  }

  addComponent<T extends Component>(type: new (...params: any) => T, ...params: any): T {
    const component = new type(...params)
    this.components[type.name] = component

    return component
  }

  getComponent<T extends Component>(type: new (...params: any) => T): T | undefined {
    return this.components[type.name] as T
  }

  removeComponent<T extends Component>(type: new (...params: any) => T): T | undefined {
    const component = this.components[type.name] as T

    delete this.components[type.name]

    return component
  }

  hasComponent<T extends Component>(type: new (...params: any) => T): boolean {
    return this.components[type.name] != undefined
  }

  update?(deltaTime: number): void
  _update(deltaTime: number) {
    Object.values(this.components).forEach((c) => {
      c.update?.(deltaTime)
    })
  }
}
