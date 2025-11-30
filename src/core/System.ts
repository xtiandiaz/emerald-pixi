import { Entity, type EntityProvider, type SignalEmitter } from './'

export default abstract class System {
  abstract init(): void
  abstract deinit(): void

  abstract update(ec: EntityProvider, se: SignalEmitter, dt: number): void

  onEntityAdded?(entity: Entity): void
  onEntityRemoved?(entity: Entity): void
}
