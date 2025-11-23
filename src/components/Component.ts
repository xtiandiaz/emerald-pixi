import type { Container, Rectangle } from 'pixi.js'

export default abstract class Component {
  private _container: Container

  constructor(container: Container) {
    this._container = container
  }

  get container(): Container {
    return this._container
  }

  draw?(rect: Rectangle): void
  start?(): void
  update?(deltaTime: number): void
  resize?(bounds: Rectangle): void
  end?(): void
}
