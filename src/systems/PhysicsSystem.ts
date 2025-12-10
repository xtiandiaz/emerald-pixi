import { Engine, Body, Composite, Events, Pair } from 'matter-js'
import { System, World, Entity, type SignalBus } from '../core'
import { Physics } from '../components'
import { CollisionSignal, EntityAddedSignal, EntityRemovedSignal } from '../signals'

export class PhysicsSystem extends System {
  private engine: Matter.Engine
  private bodyIndex = new Map<number, number>() // bodyId: entityId

  constructor() {
    super()

    this.engine = Engine.create({
      gravity: {
        y: 0,
        scale: 0.0001,
      },
    })
  }

  init(world: World, sb: SignalBus): void {
    this.connections.push(
      sb.connect(EntityAddedSignal, (s) => this.addBodyIfNeeded(world.getEntity(s.entityId)!)),
      sb.connect(EntityRemovedSignal, (s) =>
        this.removeBodyIfNeeded(world.getRemovedEntity(s.entityId)!),
      ),
    )

    Events.on(this.engine, 'collisionStart', (e) => {
      this.processCollisionPairs(e.pairs, e.name, sb, world)
    })
    // Events.on(this.engine, 'collisionActive', (e) => {
    //   this.processPairs(e.pairs, e.name)
    // })
    // Events.on(this.engine, 'collisionEnd', (e) => {
    //   this.processCollisionPairs(e.pairs, e.name)
    // })
  }

  update(world: World, sb: SignalBus, dt: number): void {
    const ec = world.getEntitiesWithComponent(Physics)
    ec.filter(({ c }) => !c.body.isStatic && !c.body.isSleeping)
      .map(({ c }) => ({ b: c.body, g: c.gravity }))
      .forEach(({ b, g }) =>
        Body.applyForce(b, b.position, g.multiplyScalar(-b.mass * this.engine.gravity.scale)),
      )

    Engine.update(this.engine)

    ec.forEach(({ e, c }) => {
      e.position.set(c.body.position.x, c.body.position.y)
      e.angle = c.body.angle
    })
  }

  private addBodyIfNeeded(entity: Entity) {
    const pc = entity.getComponent(Physics)
    if (pc && !this.bodyIndex.has(pc.body.id)) {
      Composite.add(this.engine.world, pc.body)
      this.bodyIndex.set(pc.body.id, entity.id)
    }
  }

  private removeBodyIfNeeded(removedEntity: Entity) {
    const pc = removedEntity.getComponent(Physics)
    // console.log('removing body for', removedEntity, pc)
    if (pc) {
      this.bodyIndex.delete(pc.body.id)
    }
  }

  private processCollisionPairs(pairs: Pair[], _: string, sb: SignalBus, world: World) {
    for (const pair of pairs) {
      const eIdA = this.bodyIndex.get(pair.bodyA.id)
      const eIdB = this.bodyIndex.get(pair.bodyB.id)
      if (!eIdA || !eIdB) {
        console.log('Missing entity Id(s)', eIdA, eIdB)
        return
      }
      if (!pair.bodyA.isStatic) {
        sb.emit(new CollisionSignal(eIdA, eIdB))
      }
      if (!pair.bodyB.isStatic) {
        sb.emit(new CollisionSignal(eIdB, eIdA))
      }
    }
  }
}
