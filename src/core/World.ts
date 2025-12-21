import { Entity, Component, type SomeComponent } from './'
import { Container } from 'pixi.js'

export class World extends Container {
  private nextEntityId = 1
  private entities = new Map<number, Entity>()
  private eTags = new Map<string, Set<number>>()
  private removedEntities = new Map<number, Entity>()

  onEntityAdded?: (id: number) => void
  onEntityRemoved?: (id: number) => void

  createEntity(tag?: string): Entity {
    const e = new Entity(this.nextEntityId++, tag)
    this.entities.set(e.id, e)
    this.addChild(e)

    if (tag) {
      if (!this.eTags.has(tag)) {
        this.eTags.set(tag, new Set([e.id]))
      } else {
        this.eTags.get(tag)!.add(e.id)
      }
    }
    this.onEntityAdded?.(e.id)

    return e
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
    this.onEntityRemoved?.(id)
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
