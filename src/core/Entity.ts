import { Container } from 'pixi.js'
import { Component, type AnyComponent, type AnySignal } from './'
import { Signal } from '../signals'

export default class Entity extends Container {
  readonly id: number

  private static nextId = 0
  private components = new Map<string, Component>()
  private connections = new Map<string, Function>()

  constructor() {
    super()

    this.id = ++Entity.nextId
  }

  addComponent<T extends Component>(type: AnyComponent<T>, ...params: any): T {
    const component = new type(...params)
    this.components.set(type.name, component)

    return component
  }

  removeComponent<T extends Component>(type: AnyComponent<T>) {
    return this.components.delete(type.name)
  }

  hasComponent<T extends Component>(type: AnyComponent<T>) {
    return this.components.has(type.name)
  }

  getComponent<T extends Component>(type: AnyComponent<T>) {
    return this.components.get(type.name) as T
  }

  connect<T extends Signal>(signalType: AnySignal<T>, func: Function) {
    this.connections.set(signalType.name, func)
  }

  hasConnection(name: string) {
    return this.connections.has(name)
  }

  getConnection(name: string) {
    return this.connections.get(name)
  }
}
