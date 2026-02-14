import type { DomainEvent } from './domain-event';
import { AggregateRoot } from './aggregate-root';
import { createId } from '../shared-kernel/id';
import { ConcurrencyError } from '../shared-kernel/errors';

export abstract class EventSourcedAggregate<TState, TPayload = unknown> extends AggregateRoot {
  protected state: TState;
  protected _version: number;

  constructor(
    protected readonly aggregateId: string,
    protected readonly aggregateType: string,
    protected readonly orgId: string,
    initialState: TState,
    initialVersion: number,
  ) {
    super();
    this.state = initialState;
    this._version = initialVersion;
  }

  getVersion(): number {
    return this._version;
  }

  getState(): Readonly<TState> {
    return this.state;
  }

  protected abstract applyEvent(state: TState, event: DomainEvent<TPayload>): TState;

  loadFromHistory(events: DomainEvent<TPayload>[]): void {
    for (const event of events) {
      this.state = this.applyEvent(this.state, event);
      this._version = event.version;
    }
  }

  protected raise(eventType: string, payload: TPayload): void {
    this._version += 1;
    const event: DomainEvent<TPayload> = {
      eventId: createId(),
      aggregateId: this.aggregateId,
      orgId: this.orgId,
      aggregateType: this.aggregateType,
      eventType,
      version: this._version,
      occurredAt: new Date().toISOString(),
      payload,
    };
    this.state = this.applyEvent(this.state, event);
    this.addDomainEvent(event);
  }

  expectVersion(expected: number): void {
    if (this._version !== expected) {
      throw new ConcurrencyError(this.aggregateId, expected, this._version);
    }
  }
}
