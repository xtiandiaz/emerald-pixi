import { Container, type ContainerChild } from 'pixi.js'

export class Component extends Container<ContainerChild> {
  id?: string

  init?(): void
  start?(): void
  update?(deltaTime: number): void

  async onDestroy?(): Promise<void>
}
