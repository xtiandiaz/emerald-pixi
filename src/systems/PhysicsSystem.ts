import { Graphics, Matrix, type Container } from 'pixi.js'
import { System, World, type SignalBus, Vector } from '../core'
import {} from '../geometry'
import {
  calculateVelocitiesAfterCollision,
  PENETRATION_ALLOWANCE,
  PENETRATION_PERCENTAGE_TO_CORRECT,
  type Contact,
  type Collision,
  type Gravity,
  type CollisionLayerMap,
} from '../physics'
import { Body } from '../components'
import { CollisionSensorTriggered, EntityAdded } from '../signals'
import { connectContainerEvent } from '../input'
import { Game } from '../game'

export interface PhysicsSystemOptions {
  iterations: number
  gravity?: Gravity
  collisionLayerMap?: CollisionLayerMap
  _rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private gravity: Gravity
  private collisionLayerMap?: CollisionLayerMap
  private options: PhysicsSystemOptions
  private _cg?: Graphics

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.gravity = options?.gravity ?? {
      vector: new Vector(0, 9.81),
      scale: 0.001,
    }
    this.collisionLayerMap = options?.collisionLayerMap

    this.options = {
      iterations: 4,
      _rendersColliders: false,
      ...options,
    }
  }

  init(world: World, hud: Container, sb: SignalBus): void {
    if (this.options._rendersColliders) {
      this._cg = new Graphics()
      world.addChild(this._cg)
    }
    world.getEntitiesWithComponent(Body).forEach(({ e, c: rb }) => {
      e.position.copyFrom(rb.position)
      e.rotation = rb.rotation
    })

    const player = world.getEntitiesByTag('player')![0]!
    world.interactive = true
    this.connections.push(
      sb.connect(EntityAdded, (s) => {
        const e = world.getEntity(s.entityId)!
        const rb = e.getComponent(Body)
        if (rb) {
          e.position.copyFrom(rb.position)
          e.rotation = rb.rotation
        }
      }),
      connectContainerEvent('globalmousemove', world, (e) => {
        const b = player.getComponent(Body)!
        // b.position.set(e.globalX, e.globalY)
        // b.velocity.set(e.movementX, e.movementY)
      }),
    )
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const e_bs = world.getEntitiesWithComponent(Body)
    const collisions: Collision[] = []

    for (let i = 0; i < this.options.iterations; i++) {
      collisions.length = 0

      for (const { c: b } of e_bs) {
        this.updateBody(b, dT)
      }
      for (let i = 0; i < e_bs.length; i++) {
        const { c: A } = e_bs[i]!

        for (let j = i + 1; j < e_bs.length; j++) {
          const { c: B } = e_bs[j]!
          const collision = A.testForCollision(B)
          // TODO Add check of collision-ness according to layer-map
          if (collision) {
            collisions.push(collision)
          }
        }
      }
      this.resolveCollisions(collisions)
      this.separateBodies(collisions)

      // Reflect body positions on entities for rendering
      for (const { e, c: b } of e_bs) {
        e.position.set(b.position.x, b.position.y)
      }
    }
  }

  private updateBody(body: Body, dT: number) {
    if (body.isStatic) {
      return
    }
    if (!body.isKinematic) {
      const forces = this.gravity.vector.multiplyScalar(body.invMass * this.gravity.scale)
      forces.x += body.force.x * body.invMass
      forces.y += body.force.y * body.invMass
      body.force.set(0, 0)

      body.velocity.x += forces.x * dT
      body.velocity.y += forces.y * dT
    }
    body.position.x += body.velocity.x * dT
    body.position.y += body.velocity.y * dT
  }

  private resolveCollisions(collisions: Collision[]) {
    for (const { A, B, ...collision } of collisions) {
      for (const cP of collision.points) {
        // Relative vel. (missing angular vel.)
        const relV = B.velocity.subtract(A.velocity)
        // Contact vel. (missing angular vel.)
        const conV = relV.dot(collision.normal)
        if (conV > 0) {
          // Already separating...
          return
        }
        const sumInvMasses = A.invMass + B.invMass
        // Impulse scalar
        let j = -(1 + collision.restitution) * conV
        // TODO: this f*ck's up the restitution, find out why!
        // j /= sumInvMasses
        // Impulse
        const I = collision.normal.multiplyScalar(j)
        if (!A.isStatic) {
          A.velocity.x -= I.x * A.invMass
          A.velocity.y -= I.y * A.invMass
        }
        if (!B.isStatic) {
          B.velocity.x += I.x * B.invMass
          B.velocity.y += I.y * B.invMass
        }
      }
    }
  }

  private separateBodies(collisions: Collision[]) {
    for (const { A, B, penetration, normal, sumInvMasses } of collisions) {
      // Account for the masses in the correction (https://timallanwheeler.com/blog/2024/08/01/2d-collision-detection-and-resolution/)
      const relCorrection = normal.multiplyScalar(
        -penetration * sumInvMasses * (A.isStatic || B.isStatic ? 1 : 0.5),
      )
      if (!A.isStatic) {
        A.position.x -= relCorrection.x * B.mass
        A.position.y -= relCorrection.y * B.mass
      }
      if (!B.isStatic) {
        B.position.x += relCorrection.x * A.mass
        B.position.y += relCorrection.y * A.mass
      }
    }
  }
}
