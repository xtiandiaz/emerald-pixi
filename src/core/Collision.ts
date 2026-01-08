import type { Point, PointData } from 'pixi.js'
import type { Collider, EntityComponent, Range, Vector } from '../core'
import { Geometry } from './Geometry'

export namespace Collision {
  export type AABB = {
    min: PointData
    max: PointData
  }

  type EntityCollider = EntityComponent<Collider>
  export type AABBIntersectionPair = [A: EntityCollider, B: EntityCollider]

  export interface Contact {
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

  export function evaluateContact(
    projA: Range,
    projB: Range,
    axis: Vector,
    contact: Contact,
  ): boolean {
    if (!Collision.hasProjectionOverlap(projA, projB)) {
      return false
    }
    const depth = Math.min(projA.max - projB.min, projB.max - projA.min)
    if (depth < contact.depth) {
      contact.depth = depth
      contact.normal = axis.clone()
    }
    return true
  }

  export function fixContactDirectionIfNeeded(contact: Contact, centerA: Point, centerB: Point) {
    const dir = centerA.subtract(centerB)
    if (dir.dot(contact.normal) < 0) {
      contact.normal.multiplyScalar(-1, contact.normal)
    }
  }

  export function findAABBIntersectionIdPairs(
    eColliders: EntityCollider[],
    canCollide: (layerA: number, layerB: number) => boolean,
  ): AABBIntersectionPair[] {
    const pairs: AABBIntersectionPair[] = []
    let eA!: EntityCollider, eB!: EntityCollider

    for (let i = 0; i < eColliders.length - 1; i++) {
      eA = eColliders[i]!
      for (let j = i + 1; j < eColliders.length; j++) {
        eB = eColliders[j]!
        if (canCollide(eA[1].layer, eB[1].layer) && eA[1].hasAABBIntersection(eB[1])) {
          pairs.push([eA, eB])
        }
      }
    }
    return pairs
  }
}
