import { Component, System, Signal } from './'
import { Point } from 'pixi.js'

export { Point as Vector }

export enum Direction {
  Up = 'UP',
  Right = 'RIGHT',
  Down = 'DOWN',
  Left = 'LEFT',
}

export type SomeComponent<T extends Component> = new (...args: any) => T

export type SomeSystem<T extends System> = new (...params: any) => T

export type SomeSignal<T extends Signal> = new (...params: any) => T

export type SignalConnector<T extends Signal> = (s: T) => void
export type AnySignalConnector = (s: Signal) => void

export interface SignalEmitter {
  emit<T extends Signal>(signal: T): void
}

export interface SignalBus {
  connect<T extends Signal>(type: SomeSignal<T>, connector: SignalConnector<T>): Disconnectable
}

export interface Disconnectable {
  disconnect(): void
}
