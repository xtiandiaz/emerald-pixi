import { Entity, Component, type SomeComponent } from './'
import { Container } from 'pixi.js'

export class World extends Container {
  private entities = new Map<number, Entity>()
  private removedEntities = new Map<number, Entity>()

  onEntityAdded?: (id: number) => void
  onEntityRemoved?: (id: number) => void

  addEntity(...entities: Entity[]): World {
    for (const e of entities) {
      if (this.hasEntity(e.id)) {
        continue
      }
      this.entities.set(e.id, e)
      this.addChild(e)

      this.onEntityAdded?.(e.id)

      e.start?.()
    }
    return this
  }

  hasEntity(id: number): boolean {
    return this.entities.has(id)
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }
  getEntityByLabel(label: RegExp | string, deep?: boolean): Entity | undefined {
    return this.getChildByLabel(label, deep) as Entity
  }
  getEntitiesByLabel(label: RegExp | string, deep?: boolean, out?: Container[]): Entity[] {
    return this.getChildrenByLabel(label, deep, out) as Entity[]
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

    e.stop()

    this.removeChild(e)
    this.removedEntities.set(id, e)

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
