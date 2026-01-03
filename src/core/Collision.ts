import type { Point, PointData } from 'pixi.js'
import type { Collider, EntityComponent, Range, Vector } from '../core'
import { Geometry } from './Geometry'

export namespace Collision {
  export type AABB = {
    min: PointData
    max: PointData
  }

  export type AABBIntersectionIdPair = [idA: number, idB: number]

  export interface Actor {
    collider: Collider
    layer: number
  }

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

  export function findContacts(
    components: Collision.Actor[],
    canCollide: (layerA: number, layerB: number) => boolean,
    includePoints: boolean,
  ): Contact[] {
    const contacts: Contact[] = []
    // const indexPairs = findAABBIntersectionIdPairs(components, canCollide)
    // for (const [iA, iB] of indexPairs) {
    //   const contact = components[iA]!.collider.findContact(components[iB]!.collider, includePoints)
    //   if (contact) {
    //     contacts.push(contact)
    //   }
    // }
    return contacts
  }

  export function findAABBIntersectionIdPairs(
    eColliders: EntityComponent<Collider>[],
    canCollide: (layerA: number, layerB: number) => boolean,
  ): AABBIntersectionIdPair[] {
    const pairs: AABBIntersectionIdPair[] = []
    let A!: Collider, B!: Collider

    for (let i = 0; i < eColliders.length - 1; i++) {
      A = eColliders[i]![1]
      for (let j = i + 1; j < eColliders.length; j++) {
        B = eColliders[j]![1]
        if (canCollide(A.layer, B.layer) && A.hasAABBIntersection(B)) {
          pairs.push([eColliders[i]![0], eColliders[j]![0]])
        }
      }
    }
    return pairs
  }
}
