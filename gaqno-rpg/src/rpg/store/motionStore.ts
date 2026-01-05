/**
 * Motion Store - Zustand store para gerenciar eventos de animação
 * Centraliza o estado de eventos de motion ativos e histórico
 */
import { create } from 'zustand';
import { MotionEvent, MotionEventType } from '../motion/eventToMotionMap';

interface MotionEventState {
  id: string;
  event: MotionEvent;
  timestamp: number;
  completed: boolean;
}

interface MotionStore {
  // Estado
  activeEvents: Map<string, MotionEventState>;
  eventHistory: MotionEventState[];
  currentMode: 'presentation' | 'master' | 'player' | null;

  // Actions
  triggerEvent: (event: MotionEvent) => string;
  clearEvent: (eventId: string) => void;
  clearAllEvents: () => void;
  getActiveEvents: () => MotionEventState[];
  getEventsByType: (type: MotionEventType) => MotionEventState[];
  getHighestPriorityEvent: () => MotionEventState | null;
  setMode: (mode: 'presentation' | 'master' | 'player' | null) => void;
  
  // Utils
  clearCompletedEvents: () => void;
  markEventCompleted: (eventId: string) => void;
}

export const useMotionStore = create<MotionStore>((set, get) => ({
  activeEvents: new Map(),
  eventHistory: [],
  currentMode: null,

  triggerEvent: (event: MotionEvent) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    
    const eventState: MotionEventState = {
      id,
      event,
      timestamp,
      completed: false,
    };

    set((state) => {
      const newActiveEvents = new Map(state.activeEvents);
      newActiveEvents.set(id, eventState);
      
      return {
        activeEvents: newActiveEvents,
        eventHistory: [...state.eventHistory, eventState],
      };
    });

    // Auto-remove após duração (se especificada)
    if (event.duration) {
      setTimeout(() => {
        get().markEventCompleted(id);
        setTimeout(() => {
          get().clearEvent(id);
        }, 100); // Pequeno delay para transição
      }, event.duration);
    }

    return id;
  },

  clearEvent: (eventId: string) => {
    set((state) => {
      const newActiveEvents = new Map(state.activeEvents);
      newActiveEvents.delete(eventId);
      return { activeEvents: newActiveEvents };
    });
  },

  clearAllEvents: () => {
    set({
      activeEvents: new Map(),
    });
  },

  getActiveEvents: () => {
    return Array.from(get().activeEvents.values());
  },

  getEventsByType: (type: MotionEventType) => {
    return Array.from(get().activeEvents.values()).filter(
      (eventState) => eventState.event.type === type && !eventState.completed
    );
  },

  getHighestPriorityEvent: () => {
    const events = get().getActiveEvents();
    if (events.length === 0) return null;

    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    const sorted = [...events].sort(
      (a, b) =>
        priorityOrder[a.event.priority] - priorityOrder[b.event.priority]
    );

    return sorted[0];
  },

  setMode: (mode: 'presentation' | 'master' | 'player' | null) => {
    set({ currentMode: mode });
  },

  clearCompletedEvents: () => {
    set((state) => {
      const newActiveEvents = new Map(state.activeEvents);
      for (const [id, eventState] of newActiveEvents.entries()) {
        if (eventState.completed) {
          newActiveEvents.delete(id);
        }
      }
      return { activeEvents: newActiveEvents };
    });
  },

  markEventCompleted: (eventId: string) => {
    set((state) => {
      const newActiveEvents = new Map(state.activeEvents);
      const eventState = newActiveEvents.get(eventId);
      if (eventState) {
        newActiveEvents.set(eventId, {
          ...eventState,
          completed: true,
        });
      }
      return { activeEvents: newActiveEvents };
    });
  },
}));

