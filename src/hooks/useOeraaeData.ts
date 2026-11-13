import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '../types';
import { MOCK_DATA } from '../data/mockData';

export const DEFAULT_WEBHOOK_URL: string =
  import.meta.env.VITE_N8N_URL || 'https://TU-N8N/webhook/oeraae/dashboard';
export const API_KEY: string = import.meta.env.VITE_N8N_KEY || '';

// Cabeceras para el webhook de n8n (incluye la API key si está configurada)
export function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) h['X-API-Key'] = API_KEY;
  return h;
}
const STORAGE_KEY_URL = 'oeraae_webhook_url';
const STORAGE_KEY_DEMO = 'oeraae_demo_mode';

export function useOeraaeData() {
  // Carga inicial de la URL guardada en localStorage
  const [urlWebhook, setUrlWebhook] = useState<string>(() => {
    try {
      const guardada = localStorage.getItem(STORAGE_KEY_URL);
      return guardada || DEFAULT_WEBHOOK_URL;
    } catch (e) {
      console.warn('Error accediendo a localStorage para URL:', e);
      return DEFAULT_WEBHOOK_URL;
    }
  });

  // Modo Demo: por defecto activado si la URL es el placeholder o si el usuario lo guardó
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    try {
      const guardadoDemo = localStorage.getItem(STORAGE_KEY_DEMO);
      if (guardadoDemo !== null) {
        return guardadoDemo === 'true';
      }
      const guardada = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_WEBHOOK_URL;
      return guardada.includes('TU-N8N');
    } catch {
      return true;
    }
  });

  const [data, setData] = useState<ApiResponse>(MOCK_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);

  const abortControllerRef = useRef<AbortController | null>(null);

  const setIsDemoMode = useCallback((activar: boolean) => {
    setIsDemoModeState(activar);
    try {
      localStorage.setItem(STORAGE_KEY_DEMO, String(activar));
    } catch (e) {
      console.warn('Error guardando modo demo en localStorage:', e);
    }
  }, []);

  const saveUrlWebhook = useCallback((nuevaUrl: string) => {
    setUrlWebhook(nuevaUrl);
    try {
      localStorage.setItem(STORAGE_KEY_URL, nuevaUrl);
    } catch (e) {
      console.warn('Error guardando URL en localStorage:', e);
    }
  }, []);

  // Función principal de obtención de datos
  const fetchData = useCallback(async (isManual: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    if (isDemoMode) {
      // En modo demo simulamos un pequeño retraso natural
      const timer = setTimeout(() => {
        setData(MOCK_DATA);
        setError(null);
        setLastUpdated(new Date());
        setLoading(false);
        setCountdown(30);
      }, isManual ? 400 : 200);

      return () => clearTimeout(timer);
    }

    // Modo producción con n8n
    try {
      setError(null);
      const res = await fetch(urlWebhook, {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error('NO_AUTORIZADO');
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (json && typeof json === 'object') {
        const solicitudes = Array.isArray(json.solicitudes) ? json.solicitudes : [];
        const log_errores = Array.isArray(json.log_errores) ? json.log_errores : [];

        setData({ solicitudes, log_errores });
        setError(null);
        setLastUpdated(new Date());
      } else {
        throw new Error('La respuesta de n8n no tiene el formato JSON esperado.');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('Error al conectar con n8n:', err);
      setError(
        (err as Error)?.message === 'NO_AUTORIZADO'
          ? 'n8n rechazó la petición (401/403). Revisa VITE_N8N_KEY en tu .env.'
          : 'No se pudo conectar con n8n. Verifica la URL, que el workflow esté activo, el CORS o que n8n esté encendido.'
      );
    } finally {
      setLoading(false);
      setCountdown(30);
    }
  }, [isDemoMode, urlWebhook]);

  // Carga inicial y cuando cambia el modo demo o la URL
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Temporizador para auto-refresco cada 30 segundos
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchData]);

  return {
    data,
    loading,
    error,
    isDemoMode,
    setIsDemoMode,
    urlWebhook,
    saveUrlWebhook,
    refetch: () => fetchData(true),
    lastUpdated,
    countdown,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
  };
}