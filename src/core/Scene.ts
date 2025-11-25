import { type ApplicationOptions } from 'pixi.js'
import { Entity, type System } from './'
import { PhysicsSystem, RenderSystem } from '../systems'

export default abstract class Scene {
  private entities = {} as Record<string, Entity>
  private systems: System[] = []

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    const ps = new PhysicsSystem()
    ps.init()
    this.systems.push(ps)

    const rs = new RenderSystem()
    await rs.init(options)
    this.systems.push(rs)
  }

  update(): void {
    const es = Object.values(this.entities)
    this.systems.forEach((s) => s.update(es))
  }

  addEntity(entity: Entity) {
    this.entities[entity.id] = entity
  }

  removeEntity(entityId: string) {
    delete this.entities[entityId]
  }
}
