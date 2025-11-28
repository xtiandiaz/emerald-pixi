import { Entity, type System } from '../core'
import { CollisionComponent, PhysicsComponent } from '../components'
import { Engine, Runner, Events, Body, Composite, Pair } from 'matter-js'

type EntityQuery = (id: number) => Entity | undefined

export default class PhysicsSystem implements System {
  private engine: Engine
  private runner: Runner
  private entityQuery: EntityQuery
  private bodyEntities = {} as Record<number, number>

  constructor(query: EntityQuery) {
    this.entityQuery = query
    this.engine = Engine.create()
    this.runner = Runner.create()
  }

  init() {
    Events.on<ICollisionCallback>(this.engine, 'collisionStart', (e) => {
      this.processPairs(e.pairs, e.name)
    })
    // Events.on<ICollisionCallback>(this.engine, 'collisionActive', (e) => {
    //   this.processPairs(e.pairs, e.name)
    // })
    Events.on<ICollisionCallback>(this.engine, 'collisionEnd', (e) => {
      this.processPairs(e.pairs, e.name)
    })

    Runner.run(this.runner, this.engine)
  }

  registerBody(body: Body, entity: Entity) {
    this.bodyEntities[body.id] = entity.id

    Composite.add(this.engine.world, body)
  }

  update(entities: Entity[]): void {
    for (const e of entities) {
      const pc = e.getComponent(PhysicsComponent)
      if (pc) {
        e.position.set(pc.body.position.x, pc.body.position.y)
        e.angle = pc.body.angle
      }
    }
  }

  private processPairs(pairs: Pair[], type: string) {
    for (const pair of pairs) {
      const entityIdA = this.bodyEntities[pair.bodyA.id]
      const entityIdB = this.bodyEntities[pair.bodyB.id]
      if (!entityIdA || !entityIdB) {
        console.error('missing entity Id', entityIdA, entityIdB)
        return
      }
      const entityA = this.entityQuery(entityIdA)
      const entityB = this.entityQuery(entityIdB)
      if (!entityA || !entityB) {
        console.error('missing entity', entityA, entityB)
        return
      }
      this.emitCollisionEvent(entityA, entityB, type)
      this.emitCollisionEvent(entityB, entityA, type)
    }
  }

  private emitCollisionEvent(entity: Entity, other: Entity, type: string) {
    const cc = entity.getComponent(CollisionComponent)
    if (!cc) {
      return
    }
    switch (type) {
      case 'collisionStart':
        cc.onCollisionStarted?.(other)
        break
      case 'collisionEnd':
        cc.onCollisionEnded?.(other)
    }
  }
}
