import { Engine, Composite, Events, Pair, type IEngineDefinition } from 'matter-js'
import { System, type SignalEmitter, type SignalBus, World, Entity } from '../core'
import { PhysicsComponent } from '../components'
import { CollisionSignal, EntityAddedSignal, EntityRemovedSignal } from '../signals'

export default class PhysicsSystem extends System {
  private engine: Matter.Engine
  private bodyIndex = new Map<number, number>() // bodyId: entityId

  constructor(options?: IEngineDefinition) {
    super()

    this.engine = Engine.create(options)
  }

  init(world: World, sbe: SignalBus & SignalEmitter): void {
    this.disconnectables.push(
      sbe.connect(EntityAddedSignal, (s) => this.addBodyIfNeeded(world.getEntity(s.entityId)!)),
      sbe.connect(EntityRemovedSignal, (s) =>
        this.removeBodyIfNeeded(world.getRemovedEntity(s.entityId)!),
      ),
    )

    Events.on(this.engine, 'collisionStart', (e) => {
      this.processCollisionPairs(e.pairs, e.name, sbe)
    })
    // Events.on(this.engine, 'collisionActive', (e) => {
    //   this.processPairs(e.pairs, e.name)
    // })
    // Events.on(this.engine, 'collisionEnd', (e) => {
    //   this.processCollisionPairs(e.pairs, e.name)
    // })
  }

  update(world: World, se: SignalEmitter, dt: number): void {
    Engine.update(this.engine)

    const ec = world.getEntitiesWithComponent(PhysicsComponent)
    for (const [e, pc] of ec) {
      e.position.set(pc.body.position.x, pc.body.position.y)
      e.angle = pc.body.angle
    }
  }

  private addBodyIfNeeded(entity: Entity) {
    const pc = entity.getComponent(PhysicsComponent)
    if (pc && !this.bodyIndex.has(pc.body.id)) {
      Composite.add(this.engine.world, pc.body)
      this.bodyIndex.set(pc.body.id, entity.id)
    }
  }

  private removeBodyIfNeeded(removedEntity: Entity) {
    const pc = removedEntity.getComponent(PhysicsComponent)
    // console.log('removing body for', removedEntity, pc)
    if (pc) {
      this.bodyIndex.delete(pc.body.id)
    }
  }

  private processCollisionPairs(pairs: Pair[], _: string, se: SignalEmitter) {
    for (const pair of pairs) {
      const eIdA = this.bodyIndex.get(pair.bodyA.id)
      const eIdB = this.bodyIndex.get(pair.bodyB.id)
      if (!eIdA || !eIdB) {
        console.log('Missing entity Id(s)', eIdA, eIdB)
        return
      }
      if (!pair.bodyA.isStatic) {
        se.emit(new CollisionSignal(eIdA, eIdB))
      }
      if (!pair.bodyB.isStatic) {
        se.emit(new CollisionSignal(eIdB, eIdA))
      }
    }
  }
}
