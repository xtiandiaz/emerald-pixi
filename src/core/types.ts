import type { ApplicationOptions } from 'pixi.js'
import Component from './Component'

export type AnyComponent<T extends Component> = new (...params: any) => T

export type GameAppOptions = Partial<ApplicationOptions>
export type RenderOptions = Partial<ApplicationOptions>
