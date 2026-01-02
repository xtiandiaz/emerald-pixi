import { Body, Skin } from '../components'
import { Component, type EntityComponent, type SomeComponent } from './'
import { Container } from 'pixi.js'

export class World extends Container {
  private nextEntityId = 1
  private tags = new Map<number, string>()
  private components = new Map<number, Map<string, Component>>()
  private taggedEntities = new Map<string, Set<number>>()
  private bodies = new Map<number, Body>()

  get eBodies(): EntityComponent<Body>[] {
    return [...this.bodies.entries()]
  }

  createEntity<
    T0 extends Component,
    T1 extends Component,
    T2 extends Component,
    T3 extends Component,
    T4 extends Component,
  >(c0: T0, c1?: T1, c2?: T2, c3?: T3, c4?: T4): number {
    const id = this.nextEntityId++
    if (!this.components.has(id)) {
      this.components.set(id, new Map())
    }
    this.addComponent(id, c0)
    if (c1) this.addComponent(id, c1)
    if (c2) this.addComponent(id, c2)
    if (c3) this.addComponent(id, c3)
    if (c4) this.addComponent(id, c4)
    return id
  }
  createTaggedEntity<
    T0 extends Component,
    T1 extends Component,
    T2 extends Component,
    T3 extends Component,
    T4 extends Component,
  >(tag: string, c0: T0, c1?: T1, c2?: T2, c3?: T3, c4?: T4): number {
    const id = this.createEntity(c0, c1, c2, c3, c4)

    this.tags.set(id, tag)
    if (!this.taggedEntities.has(tag)) {
      this.taggedEntities.set(tag, new Set([id]))
    } else {
      this.taggedEntities.get(tag)!.add(id)
    }

    return id
  }

  addComponent<T extends Component>(entityId: number, component: T): T | undefined {
    const cs = this.components.get(entityId)
    if (!cs) {
      console.error('Undefined entity', entityId)
      return
    }
    cs.set(component.constructor.name, component)
    if (component instanceof Skin) {
      this.addChild(component.dermis)
    } else if (component instanceof Body) {
      this.bodies.set(entityId, component)
    }
    return component
  }
  removeComponent<T extends Component>(entityId: number, type: SomeComponent<T>): boolean {
    const cs = this.components.get(entityId)
    if (!cs) {
      console.error('Undefined entity', entityId)
      return false
    }
    const c = cs.get(type.name)
    if (c) this._removeComponent(entityId, c)
    return cs.delete(type.name)
  }

  hasEntity(id: number): boolean {
    return this.components.has(id)
  }

  getComponent<T extends Component>(entityId: number, type: SomeComponent<T>): T | undefined {
    return this.components.get(entityId)?.get(type.name) as T
  }
  getComponentsByTag<T extends Component>(type: SomeComponent<T>, tag: string): T[] {
    return [...(this.taggedEntities.get(tag) ?? [])]
      .map((id) => this.components.get(id)!.get(type.name))
      .filter((c) => c != undefined) as T[]
  }
  getComponents<T extends Component>(type: SomeComponent<T>): T[] {
    const components: T[] = []
    this.components.forEach((cMap) => {
      if (cMap.has(type.name)) {
        components.push(cMap.get(type.name)! as T)
      }
    })
    return components
  }

  removeEntity(id: number) {
    const cs = this.components.get(id)
    if (cs) {
      cs.forEach((c) => this._removeComponent(id, c))
    }
    this.components.delete(id)

    const tag = this.tags.get(id)
    if (tag) {
      this.tags.delete(id)
      this.taggedEntities.get(tag)!.delete(id)
    }
  }

  clear() {
    this.tags.clear()
    this.taggedEntities.clear()
    this.components.clear()
    this.bodies.clear()
    this.removeChildren()

    this.nextEntityId = 1
  }

  private _removeComponent<T extends Component>(id: number, c: T) {
    if (c instanceof Skin) {
      this.removeChild(c.dermis)
    } else if (c instanceof Body) {
      this.bodies.delete(id)
    }
  }
}
