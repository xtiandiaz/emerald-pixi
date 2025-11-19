import type { Container, Rectangle } from 'pixi.js'

export interface Component {
  init(): void
  draw?(rect: Rectangle): void
  start?(): void
  update(container: Container, deltaTime: number): void
  end?(): void
}
