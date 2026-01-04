import type { ApplicationOptions } from 'pixi.js'
import type { PhysicsSystemOptions } from '../systems'

export interface FixedTime {
  step: number
  reserve: number
}

export interface GameOptions extends ApplicationOptions {
  physics: Partial<PhysicsSystemOptions>
}

export interface GameState {
  isPaused: boolean
}
