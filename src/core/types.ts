import type { ApplicationOptions } from 'pixi.js'
import { Entity, Component, Signal } from './'

export type AnyComponent<T extends Component> = new (...params: any) => T

export interface EntityProvider {
  getEntity(id: number): Entity | undefined
  getEntitiesWithComponent<T extends Component>(type: AnyComponent<T>): Entity[]
  getComponents<T extends Component>(type: AnyComponent<T>): T[]
}

export type AnySignal<T extends Signal> = new (...params: any) => T

export interface SignalEmitter {
  emit(s: Signal): void
}

export type GameAppOptions = Partial<ApplicationOptions>
export type RenderOptions = Partial<ApplicationOptions>
