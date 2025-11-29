import { Entity, Component, type System, type AnyComponent } from './'

export default class ECS {
  private entities = new Map<number, Entity>()

  addEntity(entity: Entity): boolean {
    const added = !this.entities.has(entity.id)
    this.entities.set(entity.id, entity)
    return added
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }

  getEntitiesWithComponent<T extends Component>(type: AnyComponent<T>): Entity[] {
    return [...this.entities.values()].filter((e) => e.hasComponent(type))
  }

  getComponents<T extends Component>(type: AnyComponent<T>): T[] {
    return this.getEntitiesWithComponent(type).map((e) => e.getComponent(type)!)
  }

  removeEntity(id: number) {
    this.entities.delete(id)
  }

  updateSystems(systems: System[], dt: number) {
    systems.forEach((s) => s.update(this, dt))
  }
}
