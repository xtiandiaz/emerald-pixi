import {
  Collider,
  Entity,
  SimpleEntity,
  type Component,
  type EntityComponent,
  type SomeComponent,
  type SomeEntity,
} from './'
import { Body } from '../components'
import { Container, RenderLayer } from 'pixi.js'

export class World extends Container {
  readonly _colliders: EntityComponent<Collider>[] = []
  readonly _bodies: EntityComponent<Body>[] = []

  private nextEntityId = 1
  private tagMap = new Map<number, string>()
  private taggedIds = new Map<string, Set<number>>()
  private entityMap = new Map<number, Entity>()
  private entityTypeMap = new Map<string, Entity>()
  private componentMap = new Map<number, Map<string, Component>>()
  private colliderMap = new Map<number, Collider>()
  private bodyMap = new Map<number, Body>()
  private renderLayers = new Map(
    [World.Layer.ENTITIES, World.Layer.UI, World.Layer.DEBUG].map((key) => [
      key,
      new RenderLayer(),
    ]),
  )

  init() {
    this.renderLayers.forEach((rl) => this.addChild(rl))
  }

  getLayer(key: World.Layer): RenderLayer {
    return this.renderLayers.get(key)!
  }

  createEntity<T extends Entity>(type: SomeEntity<T>): T {
    const id = this.nextEntityId++
    const entity = new type(
      id,
      (type) => this.hasComponent(id, type),
      (type) => this.getComponent(id, type),
      (...components) => this.addComponent(id, ...components),
      (type) => this.removeComponent(id, type),
      (tag) => this.tag(id, tag)!,
      () => this.getEntityTag(id),
    )

    this.entityMap.set(id, entity)
    this.entityTypeMap.set(type.name, entity)
    this.componentMap.set(id, new Map())

    entity.init()

    this.getLayer(World.Layer.ENTITIES).attach(entity)
    this.addChild(entity)

    return entity
  }

  createSimpleEntity<U extends Component, V extends U[]>(...components: V): SimpleEntity {
    const entity = this.createEntity(SimpleEntity)
    components.forEach((c) => entity.addComponent(c))
    return entity
  }

  hasEntity(id: number): boolean {
    return this.componentMap.has(id)
  }

  getEntity<T extends Entity>(id: number): T | undefined {
    return this.entityMap.get(id) as T
  }

  getEntityByType<T extends Entity>(type: SomeEntity<T>): T | undefined {
    return this.entityTypeMap.get(type.name) as T
  }

  getEntitiesByTag(tag: string): Entity[] {
    return [...(this.taggedIds.get(tag) ?? [])].map((id) => this.entityMap.get(id)!)
  }

  removeEntity(id: number) {
    const entity = this.entityMap.get(id)
    if (entity) {
      this.removeChild(entity)
      this.entityMap.delete(id)
    } else {
      return
    }
    this.componentMap.delete(id)
    this.colliderMap.delete(id)
    this.bodyMap.delete(id)

    const tag = this.tagMap.get(id)
    if (tag) {
      this.taggedIds.get(tag)!.delete(id)
      this.tagMap.delete(id)
    }
  }

  tag(entityId: number, tag: string): Entity | undefined {
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      return
    }
    const prevTag = this.tagMap.get(entityId)
    if (prevTag) {
      this.taggedIds.get(tag)?.delete(entityId)
    }
    this.tagMap.set(entityId, tag)
    if (this.taggedIds.has(tag)) {
      this.taggedIds.get(tag)!.add(entityId)
    } else {
      this.taggedIds.set(tag, new Set([entityId]))
    }

    return entity
  }

  getEntityTag(id: number): string | undefined {
    return this.tagMap.get(id)
  }

  hasComponent<T extends Component>(entityId: number, type: SomeComponent<T>): boolean {
    return this.componentMap.get(entityId)?.has(type.name) ?? false
  }

  getComponent<T extends Component>(entityId: number, type: SomeComponent<T>): T | undefined {
    return this.componentMap.get(entityId)?.get(type.name) as T
  }

  addComponent<T extends Component, U extends T[]>(
    entityId: number,
    ...components: U
  ): U[0] | undefined {
    const cMap = this.componentMap.get(entityId)
    if (!cMap) {
      console.error('Undefined entity', entityId)
      return
    }
    for (const c of components) {
      cMap.set(c.constructor.name, c)

      if (c instanceof Collider) {
        this.colliderMap.set(entityId, c)
      } else if (c instanceof Body) {
        // this.bodyMap.set(entityId, c)
        this._bodies.push([entityId, c])
        // this.colliderMap.set(entityId, c.collider)
      }
    }

    return components[0]
  }

  removeComponent<T extends Component>(entityId: number, type: SomeComponent<T>): boolean {
    const cMap = this.componentMap.get(entityId)
    if (!cMap) {
      console.error('Undefined entity', entityId)
      return false
    }

    const c = cMap.get(type.name)
    if (c instanceof Collider) {
      this.colliderMap.delete(entityId)
    } else if (c instanceof Body) {
      this.bodyMap.delete(entityId)
      this.colliderMap.delete(entityId)
    }

    return cMap.delete(type.name)
  }

  getEntityComponents<T extends Component>(type: SomeComponent<T>): EntityComponent<T>[] {
    const ecs: EntityComponent<T>[] = []
    for (const [eId, cs] of this.componentMap.entries()) {
      const c = cs.get(type.name)
      if (c) {
        ecs.push([eId, c as T])
      }
    }
    return ecs
  }

  getComponents<T extends Component>(type: SomeComponent<T>): T[] {
    const components: T[] = []
    this.componentMap.forEach((cMap) => {
      if (cMap.has(type.name)) {
        components.push(cMap.get(type.name)! as T)
      }
    })
    return components
  }

  clear() {
    this.tagMap.clear()
    this.taggedIds.clear()
    this.componentMap.clear()
    this.colliderMap.clear()
    this.bodyMap.clear()

    this.removeChildren()
    this.entityMap.clear()
  }
}

export namespace World {
  export interface EntityColliderBody {
    id: number
    collider: Collider
    body: Body
  }

  export enum Layer {
    ENTITIES = 'entities',
    UI = 'ui',
    DEBUG = 'debug',
  }
}
