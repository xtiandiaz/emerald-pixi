import type { PointData } from 'pixi.js'

export interface BezierCurve {
  c0: PointData
  p: PointData
  c1: PointData
}
