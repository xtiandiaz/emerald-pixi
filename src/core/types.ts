import { Entity } from './'

export { Point as Vector2 } from 'pixi.js'

export type Component = object

export interface System {
  update(entities: Entity[]): void
}
