import { Entity, type ECS } from './'

export default abstract class System {
  init?(): Promise<void>

  onEntityAdded?(entity: Entity): void

  abstract update(ecs: ECS, dt: number): void
}
