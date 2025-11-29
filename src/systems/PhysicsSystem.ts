import { ECS, Entity, System } from '../core'
import { CollisionComponent, PhysicsComponent } from '../components'
import { Engine, Events, Composite, Pair } from 'matter-js'

type CollisionInstance = [number, number, string]

export default class PhysicsSystem extends System {
  private engine: Engine
  private bodyEntities = {} as Record<number, number>
  private collisionQueue: CollisionInstance[] = []

  constructor() {
    super()

    this.engine = Engine.create()
  }

  async init() {
    Events.on(this.engine, 'collisionStart', (e) => {
      this.processCollisionPairs(e.pairs, e.name)
    })
    // Events.on(this.engine, 'collisionActive', (e) => {
    //   this.processPairs(e.pairs, e.name)
    // })
    Events.on(this.engine, 'collisionEnd', (e) => {
      this.processCollisionPairs(e.pairs, e.name)
    })
  }

  onEntityAdded(entity: Entity): void {
    const pc = entity.getComponent(PhysicsComponent)
    if (pc) {
      Composite.add(this.engine.world, pc.body)
      this.bodyEntities[pc.body.id] = entity.id
    }
  }

  update(ecs: ECS, _: number) {
    const entities = ecs.getEntitiesWithComponent(PhysicsComponent)
    for (const e of entities) {
      const pc = e.getComponent(PhysicsComponent)!
      e.position.set(pc.body.position.x, pc.body.position.y)
      e.angle = pc.body.angle
    }

    Engine.update(this.engine)

    this.collisionQueue.forEach((cp) => {
      const eA = ecs.getEntity(cp[0])
      const eB = ecs.getEntity(cp[1])
      if (eA && eB) {
        this.emitCollisionEvent(eA, eB, cp[2])
      }
    })
    this.collisionQueue.length = 0
  }

  private processCollisionPairs(pairs: Pair[], eventName: string) {
    for (const pair of pairs) {
      const entityIdA = this.bodyEntities[pair.bodyA.id]
      const entityIdB = this.bodyEntities[pair.bodyB.id]
      if (!entityIdA || !entityIdB) {
        console.error('missing entity Id', entityIdA, entityIdB)
        return
      }
      this.collisionQueue.push([entityIdA, entityIdB, eventName], [entityIdB, entityIdA, eventName])
    }
  }

  private emitCollisionEvent(entity: Entity, other: Entity, name: string) {
    const cc = entity.getComponent(CollisionComponent)
    if (!cc) {
      return
    }
    switch (name) {
      case 'collisionStart':
        cc.onCollisionStarted?.(other)
        break
      case 'collisionEnd':
        cc.onCollisionEnded?.(other)
    }
  }
}
