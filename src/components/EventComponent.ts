import { Event } from '../signals'

export default class EventComponent<E extends Event> {
  constructor(public event: E) {}
}
