/**
 * MotionProvider - Provider para contexto global de motion
 * Gerencia o modo atual e fornece contexto para componentes filhos
 */
import React, { useEffect } from 'react';
import { useMotionStore } from '../store/motionStore';
import { SessionMode } from '../types/rpg.types';

interface MotionProviderProps {
  children: React.ReactNode;
  mode: SessionMode;
}

export const MotionProvider: React.FC<MotionProviderProps> = ({
  children,
  mode,
}) => {
  const { setMode, clearAllEvents } = useMotionStore();

  useEffect(() => {
    setMode(mode);
    
    // Limpa eventos ao mudar de modo
    return () => {
      clearAllEvents();
    };
  }, [mode, setMode, clearAllEvents]);

  return <>{children}</>;
};

