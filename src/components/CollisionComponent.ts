import type { Entity } from '../core'

export default class CollisionComponent {
  onCollisionStarted?: (other: Entity) => void
  onCollisionEnded?: (other: Entity) => void
}
