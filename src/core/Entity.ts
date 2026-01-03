import { Container } from 'pixi.js'
import type { Collider, Component, SomeComponent } from './'

export abstract class Entity extends Container {
  constructor(
    public readonly id: number,
    public hasComponent: <T extends Component>(type: SomeComponent<T>) => boolean,
    public getComponent: <T extends Component>(type: SomeComponent<T>) => T | undefined,
    public addComponent: <T extends Component, U extends T[]>(...components: U) => U[0] | undefined,
    public removeComponent: <T extends Component>(type: SomeComponent<T>) => boolean,
    public tag: (tag: string) => void,
    public getTag: () => string | undefined,
  ) {
    super()
  }

  abstract init(): void

  onCollision?(other: Collider): void
}
