import { Point, type PointData } from 'pixi.js'
import {
  isNearlyEqual,
  type EntityComponent,
  type Range,
  type Vector,
  type VectorData,
} from '../core'
import { Collider, Body } from '../components'
import { Geometry } from './Geometry'

export namespace Collision {
  export type LayerMap = Map<number, number>

  export type AABB = {
    min: PointData
    max: PointData
  }

  type EntityCollider = EntityComponent<Collider>
  type EntityBody = EntityComponent<Body>

  export type AABBIntersectionPair = [A: EntityCollider, B: EntityCollider]
  export type AABBIntersectionBodyPair = [A: EntityBody, B: EntityBody]

  export interface ProjectionOverlap {
    depth: number
    normal: Vector
  }

  export interface ContactPointTracking {
    cp1: Point
    cp1_minDistSqrd: number
    cp2?: Point
    validCount: 1 | 2
  }

  export interface ShapeContact extends ProjectionOverlap {
    points?: Point[]
  }

  export interface Instance extends ShapeContact {
    A: Body
    B: Body
  }

  export function isAABBIntersection(a: AABB, b: AABB): boolean {
    return !(a.max.x < b.min.x || a.max.y < b.min.y || b.max.x < a.min.x || b.max.y < a.min.y)
  }

  export function hasProjectionOverlap(a: Range, b: Range): boolean {
    return !(a.max <= b.min || b.max <= a.min)
  }

  export function canCollide(layerA: number, layerB: number, map?: LayerMap): boolean {
    return !map || (((map.get(layerA) ?? 0) & layerB) | ((map.get(layerB) ?? 0) & layerA)) != 0
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

  export function getProjectionRange(vertices: PointData[], axis: VectorData): Range {
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

  export function findContactPointsOnPolygon(
    origin: Point,
    vertices: Point[],
    ref_tracking?: ContactPointTracking,
  ): ContactPointTracking {
    if (!ref_tracking) {
      ref_tracking = { cp1: new Point(), cp1_minDistSqrd: Infinity, validCount: 1 }
    }
    let segment!: Geometry.Segment
    for (let i = 0; i < vertices.length; i++) {
      segment = {
        a: vertices[i]!,
        b: vertices[(i + 1) % vertices.length]!,
      }
      const cp = Geometry.findClosestPointAtSegment(origin, segment)
      const distSqrd = origin.subtract(cp).magnitudeSquared()
      if (
        ref_tracking.cp2 &&
        isNearlyEqual(distSqrd, ref_tracking.cp1_minDistSqrd) &&
        !ref_tracking.cp1.isNearlyEqual(cp)
      ) {
        ref_tracking.cp2.set(cp.x, cp.y)
        ref_tracking.validCount = 2
      } else if (distSqrd < ref_tracking.cp1_minDistSqrd) {
        ref_tracking.cp1.set(cp.x, cp.y)
        ref_tracking.cp1_minDistSqrd = distSqrd
        ref_tracking.validCount = 1
      }
    }
    return ref_tracking
  }

  export function evaluateProjectionOverlap(
    projA: Range,
    projB: Range,
    axis: VectorData,
    ref_projOverlap: ProjectionOverlap,
  ): boolean {
    if (!Collision.hasProjectionOverlap(projA, projB)) {
      return false
    }
    const depth = Math.min(projA.max - projB.min, projB.max - projA.min)
    if (depth < ref_projOverlap.depth) {
      ref_projOverlap.depth = depth
      ref_projOverlap.normal.set(axis.x, axis.y)
    }
    return true
  }

  export function findInstances(
    bodies: EntityBody[],
    canCollide: (layerA: number, layerB: number) => boolean,
  ): Instance[] {
    const instances: Instance[] = []
    let A: Body, B: Body

    for (let i = 0; i < bodies.length - 1; i++) {
      A = bodies[i]![1]
      for (let j = i + 1; j < bodies.length; j++) {
        B = bodies[j]![1]
        if (!canCollide(A.layer, B.layer) || !A.shape.hasAABBIntersection(B.shape)) {
          continue
        }
        const shapeContact = A.shape.findContact(B.shape, true)
        if (shapeContact) {
          instances.push({ A, B, ...shapeContact })
        }
      }
    }
    return instances
  }

  export function findContactPoints(verticesA: Point[], verticesB: Point[]): Point[] {
    const tracking: ContactPointTracking = {
      cp1: new Point(),
      cp1_minDistSqrd: Infinity,
      cp2: new Point(),
      validCount: 1,
    }
    for (let i = 0; i < verticesA.length; i++) {
      findContactPointsOnPolygon(verticesA[i]!, verticesB, tracking)
    }
    for (let i = 0; i < verticesB.length; i++) {
      findContactPointsOnPolygon(verticesB[i]!, verticesA, tracking)
    }
    return tracking.validCount == 2 ? [tracking.cp1, tracking.cp2!] : [tracking.cp1]
  }

  export function correctContactDirectionIfNeeded(
    A: Collider.Shape,
    B: Collider.Shape,
    ref_contact: ShapeContact,
  ) {
    if (B.center.subtract(A.center).dot(ref_contact.normal) < 0) {
      ref_contact.normal.multiplyScalar(-1, ref_contact.normal)
    }
  }

  export function findAABBIntersectionPairs(
    eColliders: EntityCollider[],
    canCollide: (idA: number, layerA: number, idB: number, layerB: number) => boolean,
  ): AABBIntersectionPair[] {
    const pairs: AABBIntersectionPair[] = []
    let eA!: EntityCollider, eB!: EntityCollider

    for (let i = 0; i < eColliders.length - 1; i++) {
      eA = eColliders[i]!
      for (let j = i + 1; j < eColliders.length; j++) {
        eB = eColliders[j]!
        if (
          canCollide(eA[0], eA[1].layer, eB[0], eB[1].layer) &&
          eA[1].shape.hasAABBIntersection(eB[1].shape)
        ) {
          pairs.push([eA, eB])
        }
      }
    }
    return pairs
  }
}
