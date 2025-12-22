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
    // CORREÇÃO: Sinais silenciosos têm peso MAIOR (princípio invertido)
    const weights = {
      silent_consumption: 1.8,           // MAIOR peso: consumo sem interação
      view_duration: 1.6,                // Alto peso: tempo dedicado
      temporal_recurrence: 1.5,          // Padrões naturais de retorno
      content_resonance: 1.4,            // Afinidade orgânica
      artist_profile_view: 1.3,          // Interesse espontâneo
      spontaneous_return: 1.2,           // Retorno voluntário
      interaction_depth: 1.1,            // Profundidade exploratória
      genre_deep_dive: 1.0,              // Exploração de categoria
      organizer_attendance_pattern: 1.0, // REDUZIDO: ação explícita
      repeat_organizer_visit: 0.9,       // REDUZIDO: ação repetida
      navigation_pattern: 0.7,           // Navegação geral
      purchase_abandonment: 0.6,         // Abandono intencional
      abandonment_point: 0.5             // Ponto de saída
    };

    let weight = weights[type] || 1.0;

    // Ajustar peso baseado na duração (se aplicável)
    if (context.duration_seconds) {
      if (context.duration_seconds > 60) weight *= 1.2;
      if (context.duration_seconds > 300) weight *= 1.5;
      if (context.duration_seconds > 600) weight *= 1.8; // +10min = muito engajado
    }

    // Ajustar peso baseado na profundidade de scroll
    if (context.scroll_depth > 0.7) weight *= 1.3;

    // Boost para padrões de organizador
    if (context.organizer_id && context.attendance_count > 2) {
      weight *= 1.4;
    }

    // Penalizar abandono repetido
    if (type === 'purchase_abandonment' && context.abandonment_count > 3) {
      weight *= 0.5;
    }

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
    },
    captureArtistProfileView: (duration, additionalContext = {}) => {
      captureSignal('artist_profile_view', {
        ...context,
        ...additionalContext,
        duration_seconds: duration
      });
    },
    captureOrganizerPattern: (organizerId, attendanceCount, additionalContext = {}) => {
      captureSignal('organizer_attendance_pattern', {
        ...context,
        ...additionalContext,
        organizer_id: organizerId,
        attendance_count: attendanceCount
      });
    },
    capturePurchaseAbandonment: (abandonmentCount, additionalContext = {}) => {
      captureSignal('purchase_abandonment', {
        ...context,
        ...additionalContext,
        abandonment_count: abandonmentCount
      });
    }
  };
}

export default useSignalCapture;