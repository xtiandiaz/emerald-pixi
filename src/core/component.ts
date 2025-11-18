import { Container, Rectangle, type ContainerChild } from 'pixi.js'

export class Component extends Container<ContainerChild> {
  onInit?: (self: Component) => void
  onStart?: (self: Component) => void
  onDraw?: (self: Component, rect: Rectangle) => void
  onUpdate?: (self: Component, deltaTime: number) => void

  private static nextId = 0
  private readonly _id = Component.nextId++
  private _isInit = false
  private _isStarted = false

  get id(): string {
    return this._id.toString()
  }

  get isInit(): boolean {
    return this._isInit
  }

  get isStarted(): boolean {
    return this._isStarted
  }

  init(): void {
    this._isInit = true

    this.onInit?.(this)
  }

  start(): void {
    this._isStarted = true

    this.onStart?.(this)
  }

  draw(rect: Rectangle): void {
    this.onDraw?.(this, rect)
  }

  update(deltaTime: number): void {
    this.onUpdate?.(this, deltaTime)
  }

  async onDestroy?(): Promise<void>
}
