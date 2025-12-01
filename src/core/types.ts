import { Entity, Component, Signal } from './'

export enum Direction {
  Up,
  Right,
  Down,
  Left,
}

export type AnyComponent<T extends Component> = new (...params: any) => T

export interface EntityProvider {
  getEntity(id: number): Entity | undefined
  getEntitiesWithComponent<T extends Component>(type: AnyComponent<T>): Entity[]
  getComponents<T extends Component>(type: AnyComponent<T>): T[]
}

export type AnySignal<T extends Signal> = new (...params: any) => T

export interface TargetedSignal {
  signal: Signal
  targetId: number
}

export interface SignalEmitter {
  emit(tSignal: TargetedSignal): void
}
