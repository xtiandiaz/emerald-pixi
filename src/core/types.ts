import { Entity } from './'

export type Component = object

export interface System {
  update(entities: Entity[]): void
}
