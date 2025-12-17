import { Component, System, Signal } from './'
import { Point } from 'pixi.js'

export { Point as Vector }

export interface Range {
  min: number
  max: number
}

export enum Direction {
  Up = 'UP',
  Right = 'RIGHT',
  Down = 'DOWN',
  Left = 'LEFT',
}

export type KeyMap<T> = { [key: string]: T }

export type SomeComponent<T extends Component> = new (...args: any) => T

export type SomeSystem<T extends System> = new (...args: any) => T

export type SomeSignal<T extends Signal> = new (...args: any) => T

export type SignalConnector<T extends Signal> = (s: T) => void
export type AnySignalConnector = (s: Signal) => void

export interface SignalBus {
  emit<T extends Signal>(signal: T): void
  queue<T extends Signal>(signal: T): void
  connect<T extends Signal>(type: SomeSignal<T>, connector: SignalConnector<T>): Disconnectable
}

export interface Disconnectable {
  disconnect(): void
}
