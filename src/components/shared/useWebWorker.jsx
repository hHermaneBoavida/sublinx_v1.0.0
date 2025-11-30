import { useEffect, useRef, useCallback } from "react";

export function useWebWorker(workerCode) {
  const workerRef = useRef(null);
  const callbacksRef = useRef(new Map());

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    try {
      workerRef.current = new Worker(workerUrl);
      
      workerRef.current.onmessage = (e) => {
        const callback = callbacksRef.current.get(e.data.type);
        if (callback) {
          callback(e.data);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    } catch (error) {
      console.error('Failed to create worker:', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [workerCode]);

  const postMessage = useCallback((data, callback) => {
    if (!workerRef.current) {
      console.warn('Worker not ready');
      return;
    }

    if (callback && data.action) {
      callbacksRef.current.set(
        data.action === 'calculateDistances' ? 'distances_calculated' : 'sorted',
        callback
      );
    }

    workerRef.current.postMessage(data);
  }, []);

  return { postMessage };
}