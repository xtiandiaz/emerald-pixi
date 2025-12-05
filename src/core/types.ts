import { Component, System, Signal } from './'
import { Point } from 'pixi.js'

export { Point as Vector }

export enum Direction {
  Up = 'UP',
  Right = 'RIGHT',
  Down = 'DOWN',
  Left = 'LEFT',
}

export type SomeComponent<T extends Component> = new (...params: any) => T

export type SomeSystem<T extends System> = new (...params: any) => T

export type SomeSignal<T extends Signal> = new (...params: any) => T

export type SignalReceptor<T extends Signal> = (s: T) => void
export type AnySignalReceptor = (s: Signal) => void

export interface SignalEmitter {
  emit<T extends Signal>(signal: T): void
}

export interface SignalBus {
  connect<T extends Signal>(type: SomeSignal<T>, receptor: SignalReceptor<T>): Disconnectable
}

export interface Disconnectable {
  disconnect(): void
}
