import { Body, Skin, type EntityBody } from '../components'
import { Entity, Component, type SomeComponent } from './'
import { Container } from 'pixi.js'

export class World extends Container {
  private nextEntityId = 1
  private entities = new Map<number, Entity>()
  private eTags = new Map<string, Set<number>>()
  private removedEntities = new Map<number, Entity>()
  private components = new Map<number, Map<string, Component>>()
  private bodies = new Map<number, Body>()

  get eBodies(): EntityBody[] {
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

    if (!this.eTags.has(tag)) {
      this.eTags.set(tag, new Set([id]))
    } else {
      this.eTags.get(tag)!.add(id)
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
      this.addChild(component._dermis)
    } else if (component instanceof Body) {
      this.bodies.set(entityId, component)
    }
    return component
  }
  removeComponent<T extends Component>(entityId: number, component: SomeComponent<T>): boolean {
    const cs = this.components.get(entityId)
    if (!cs) {
      console.error('Undefined entity', entityId)
      return false
    }
    const c = cs.get(component.name)
    if (c instanceof Skin) {
      this.removeChild(c._dermis)
    } else if (c instanceof Body) {
      this.bodies.delete(entityId)
    }
    return cs.delete(component.name)
  }

  hasEntity(id: number): boolean {
    return this.entities.has(id)
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }
  getEntitiesByTag(tag: string): Entity[] | undefined {
    const ids = this.eTags.get(tag)
    if (ids) {
      return [...ids].map((id) => this.entities.get(id)!)
    }
  }
  getEntitiesWithComponent<T extends Component>(type: SomeComponent<T>): { e: Entity; c: T }[] {
    return [...this.entities.values()]
      .filter((e) => e.hasComponent(type))
      .map((e) => ({ e, c: e.getComponent(type)! }))
  }

  getComponent<T extends Component>(entityId: number, type: SomeComponent<T>): T | undefined {
    return this.components.get(entityId)?.get(type.name) as T
  }
  getComponents<T extends Component>(type: SomeComponent<T>): T[] {
    const cs: T[] = []
    this.entities.forEach((e) => {
      if (e.hasComponent(type)) {
        cs.push(e.getComponent(type)!)
      }
    })
    return cs
  }

  removeEntity(id: number) {
    const e = this.getEntity(id)
    if (!e) {
      return
    }
    this.entities.delete(id)

    this.removeChild(e)
    this.removedEntities.set(id, e)

    if (e.tag) {
      this.eTags.get(e.tag)!.delete(e.id)
    }
    // this.onEntityRemoved?.(id)
  }

  getRemovedEntity(id: number) {
    return this.removedEntities.get(id)
  }

  disposeOfRemovedEntities() {
    this.removedEntities.clear()
  }

  clear() {
    this.entities.clear()
    this.disposeOfRemovedEntities()
    this.removeChildren()
  }
}
