import { Entity, type System } from './'
import { InputSystem } from '../systems'
import { Container } from 'pixi.js'

export default abstract class Scene extends Container {
  readonly name: string
  readonly addedEntities: Entity[] = []
  readonly removedEntities: number[] = [] // TODO: handle if any, and clear
  readonly systems: System[] = []

  constructor(name: string) {
    super()

    this.name = name
    this.systems.push(new InputSystem(this))
  }

  async init(): Promise<void> {
    for await (const s of this.systems) {
      await s.init?.()
    }
  }

  addEntity(e: Entity) {
    this.addChild(e)
    this.addedEntities.push(e)
  }
}
