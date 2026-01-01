import type { Point } from 'pixi.js'
import { CircleCollider, type Vector, type Collider, type Collision } from '../core'

export namespace Physics {
  export interface Gravity {
    vector: Vector
    value: number
  }

  export interface Friction {
    static: number
    dynamic: number
  }

  export interface Collision extends Collision.Result {
    points: Point[]
    restitution: number
    friction: Friction
  }

  /* 
    Area Density: https://en.wikipedia.org/wiki/Area_density
  */
  export function calculateMass(area: number, density: number = 1) {
    return area * density
  }

  export function calculateColliderInertia(collider: Collider, mass: number) {
    if (collider instanceof CircleCollider) {
      return mass * collider.radius * collider.radius
    } else {
      // TODO Find out why
      const w = collider.aabb.max.x - collider.aabb.min.x
      const h = collider.aabb.max.y - collider.aabb.min.y
      return (mass * (w * w + h * h)) / 12
    }
  }
}
