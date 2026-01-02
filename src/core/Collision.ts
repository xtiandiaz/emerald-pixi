import type { Point, PointData } from 'pixi.js'
import type { Collider, Range, Vector, Component as CoreComponent, EntityComponent } from '../core'
import { Geometry } from './Geometry'

export namespace Collision {
  export type AABB = {
    min: PointData
    max: PointData
  }

  export type AABBIntersectionIndexPair = [idA: number, idB: number]

  export interface Component extends CoreComponent {
    collider: Collider
    layer: number
  }

  export interface Result {
    depth: number
    normal: Vector
    points?: Point[]
  }

  export type LayerMap = Map<number, number>

  export function isAABBIntersection(a: AABB, b: AABB): boolean {
    return !(a.max.x < b.min.x || a.max.y < b.min.y || b.max.x < a.min.x || b.max.y < a.min.y)
  }

  export function hasProjectionOverlap(a: Range, b: Range): boolean {
    return !(a.max <= b.min || b.max <= a.min)
  }

  export function getClosestVertexIndexToPoint(vertices: Point[], p: PointData): number {
    let index = -1
    let distSqrd = Infinity
    for (let i = 0; i < vertices.length; i++) {
      const dSq = vertices[i]!.subtract(p).magnitudeSquared()
      if (dSq < distSqrd) {
        distSqrd = dSq
        index = i
      }
    }
    return index
  }

  export function getVerticesProjectionRange(vertices: PointData[], axis: Vector): Range {
    const range: Range = { min: Infinity, max: -Infinity }
    let proj: number

    for (let i = 0; i < vertices.length; i++) {
      proj = vertices[i]!.x * axis.x + vertices[i]!.y * axis.y
      range.min = Math.min(range.min, proj)
      range.max = Math.max(range.max, proj)
    }
    return range
  }

  export function getCircleProjectionRange(
    position: PointData,
    radius: number,
    axis: Vector,
  ): Range {
    const dot = axis.x * position.x + axis.y * position.y
    const projs: [number, number] = [dot - radius, dot + radius]

    return projs[0] < projs[1] ? { min: projs[0], max: projs[1] } : { min: projs[1], max: projs[0] }
  }

  export function findClosestPointOnVertices(fromP: Point, vertices: Point[]): Point {
    let closestPoint!: Point
    let segment!: Geometry.Segment
    let minDistSqrd: number = Infinity
    for (let i = 0; i < vertices.length; i++) {
      segment = {
        a: vertices[i]!,
        b: vertices[(i + 1) % vertices.length]!,
      }
      const cp = Geometry.findClosestPointOnSegment(fromP, segment)
      const distSqrd = fromP.subtract(cp).magnitudeSquared()
      if (distSqrd < minDistSqrd) {
        closestPoint = cp
        minDistSqrd = distSqrd
      }
    }
    return closestPoint
  }

  export function findAABBIntersectionIndexPairs(
    collisionComponents: Collision.Component[],
    canCollide: (layerA: number, layerB: number) => boolean,
  ): AABBIntersectionIndexPair[] {
    const pairs: AABBIntersectionIndexPair[] = []
    let A!: Collision.Component, B!: Collision.Component

    for (let i = 0; i < collisionComponents.length - 1; i++) {
      A = collisionComponents[i]!
      for (let j = i + 1; j < collisionComponents.length; j++) {
        B = collisionComponents[j]!
        if (canCollide(A.layer, B.layer) && A.collider.hasAABBIntersection(B.collider)) {
          pairs.push([i, j])
        }
      }
    }
    return pairs
  }
}
