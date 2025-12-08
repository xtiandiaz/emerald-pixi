import { Entity, Component, type SomeComponent } from './'
import { Container } from 'pixi.js'

export class World extends Container {
  private entities = new Map<number, Entity>()
  private taggedEntities = new Map<string, Entity>()
  private removedEntities = new Map<number, Entity>()

  onEntityAdded?: (id: number) => void
  onEntityRemoved?: (id: number) => void

  addEntity(...entities: Entity[]): Entity {
    entities.forEach((e) => {
      this.entities.set(e.id, e)
      if (e.tag) {
        this.taggedEntities.set(e.tag, e)
      }
      this.addChild(e)

      this.onEntityAdded?.(e.id)
    })
    return entities[0]!
  }

  hasEntity(id: number): boolean {
    return this.entities.has(id)
  }
  hasEntityByTag(tag: string): boolean {
    return this.taggedEntities.has(tag)
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }
  getEntityByTag(tag: string): Entity | undefined {
    return this.taggedEntities.get(tag)
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
    if (e.tag) {
      this.taggedEntities.delete(e.tag)
    }
    this.removeChild(e)
    this.removedEntities.set(e.id, e)

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
    this.taggedEntities.clear()
    this.disposeOfRemovedEntities()
    this.removeChildren()
  }
}
