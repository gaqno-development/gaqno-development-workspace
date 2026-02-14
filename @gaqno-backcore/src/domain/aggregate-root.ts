import type { DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private readonly _uncommittedEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this._uncommittedEvents.length = 0;
  }

  hasUncommittedEvents(): boolean {
    return this._uncommittedEvents.length > 0;
  }
}
