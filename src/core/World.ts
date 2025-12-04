import { Entity, Component, type SomeComponent } from './'
import { Container } from 'pixi.js'

export default class World extends Container {
  private entities = new Map<number, Entity>()
  private removedEntities = new Map<number, Entity>()

  onEntityAdded?: (id: number) => void
  onEntityRemoved?: (id: number) => void

  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity)
    this.addChild(entity)

    this.onEntityAdded?.(entity.id)
  }

  hasEntity(id: number): boolean {
    return this.entities.has(id)
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }

  getEntitiesWithComponent<T extends Component>(type: SomeComponent<T>): [Entity, T][] {
    return [...this.entities.values()]
      .filter((e) => e.hasComponent(type))
      .map((e) => [e, e.getComponent(type)!])
  }

  removeEntity(id: number) {
    const e = this.getEntity(id)
    if (!e) {
      return
    }
    this.entities.delete(id)
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
    this.disposeOfRemovedEntities()
    this.removeChildren()
  }
}
