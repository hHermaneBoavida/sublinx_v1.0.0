import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Hook para capturar sinais comportamentais de forma passiva
export function useSignalCapture(user, context = {}) {
  const startTimeRef = useRef(Date.now());
  const signalsQueueRef = useRef([]);
  const flushTimerRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    startTimeRef.current = Date.now();

    // Capturar tempo na página ao desmontar
    return () => {
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      
      // Apenas capturar se passou tempo significativo (>3s)
      if (durationSeconds > 3) {
        captureSignal('view_duration', {
          ...context,
          duration_seconds: durationSeconds,
          time_of_day: new Date().toTimeString().slice(0, 5),
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'short' })
        });
      }

      // Flush final
      flushSignals();
    };
  }, [user?.id, context.event_id]);

  const captureSignal = (signalType, signalContext) => {
    if (!user?.id) return;

    const signal = {
      user_id: user.id,
      signal_type: signalType,
      context: signalContext,
      weight: calculateSignalWeight(signalType, signalContext),
      decay_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    signalsQueueRef.current.push(signal);

    // Flush em batch após 5 segundos
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flushSignals, 5000);
  };

  const flushSignals = async () => {
    if (signalsQueueRef.current.length === 0) return;

    const signalsToSend = [...signalsQueueRef.current];
    signalsQueueRef.current = [];

    try {
      await Promise.all(
        signalsToSend.map(signal => 
          base44.entities.UserBehaviorSignal.create(signal)
        )
      );
    } catch (error) {
      console.warn('Falha ao enviar sinais:', error);
    }
  };

  const calculateSignalWeight = (type, context) => {
    // Sinais mais fortes recebem pesos maiores
    const weights = {
      spontaneous_return: 1.5,
      temporal_recurrence: 1.3,
      interaction_depth: 1.2,
      content_resonance: 1.2,
      view_duration: 1.0,
      silent_consumption: 0.8,
      navigation_pattern: 0.7,
      abandonment_point: 0.5
    };

    let weight = weights[type] || 1.0;

    // Ajustar peso baseado na duração (se aplicável)
    if (context.duration_seconds) {
      if (context.duration_seconds > 60) weight *= 1.2;
      if (context.duration_seconds > 300) weight *= 1.5;
    }

    // Ajustar peso baseado na profundidade de scroll
    if (context.scroll_depth > 0.7) weight *= 1.3;

    return weight;
  };

  return {
    captureSignal,
    captureViewDuration: (duration, additionalContext = {}) => {
      captureSignal('view_duration', {
        ...context,
        ...additionalContext,
        duration_seconds: duration,
        time_of_day: new Date().toTimeString().slice(0, 5),
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'short' })
      });
    },
    captureSilentConsumption: (additionalContext = {}) => {
      captureSignal('silent_consumption', {
        ...context,
        ...additionalContext
      });
    },
    captureInteractionDepth: (scrollDepth, additionalContext = {}) => {
      captureSignal('interaction_depth', {
        ...context,
        ...additionalContext,
        scroll_depth: scrollDepth
      });
    },
    captureSpontaneousReturn: (additionalContext = {}) => {
      captureSignal('spontaneous_return', {
        ...context,
        ...additionalContext
      });
    }
  };
}

export default useSignalCapture;