import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '../types';
import { MOCK_DATA } from '../data/mockData';

export const DEFAULT_WEBHOOK_URL = 'https://TU-N8N/webhook/listar-solicitudes';
export const OPCIONES_INTERVALO_MS = [
  { label: '1 minuto', value: 60_000 },
  { label: '5 minutos (Recomendado)', value: 300_000 },
  { label: '10 minutos', value: 600_000 },
] as const;

const DEFAULT_REFRESH_INTERVAL_MS = 300_000; // 5 minutos por defecto para proteger la cuota de ngrok
const STORAGE_KEY_URL = 'oeraae_webhook_url';
const STORAGE_KEY_DEMO = 'oeraae_demo_mode';
const STORAGE_KEY_INTERVAL = 'oeraae_refresh_interval_ms';
const STORAGE_KEY_CACHE = 'oeraae_data_cache';

interface CachedPayload {
  data: ApiResponse;
  timestamp: number;
  url: string;
}

function leerCacheLocal(urlEsperada: string): CachedPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (
      parsed &&
      parsed.data &&
      Array.isArray(parsed.data.solicitudes) &&
      Array.isArray(parsed.data.log_errores) &&
      typeof parsed.timestamp === 'number' &&
      parsed.url === urlEsperada
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function guardarCacheLocal(data: ApiResponse, url: string, timestamp: number) {
  try {
    const payload: CachedPayload = { data, timestamp, url };
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(payload));
  } catch (e) {
    console.warn('No se pudo guardar la caché local en localStorage:', e);
  }
}

export function useOeraaeData(enabled: boolean = true) {
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

  // Intervalo de refresco automático configurable (1 min, 5 min, 10 min) - Por defecto 5 minutos
  const [refreshIntervalMs, setRefreshIntervalMsState] = useState<number>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_INTERVAL);
      const parsed = guardado ? Number(guardado) : NaN;
      if ([60_000, 300_000, 600_000].includes(parsed)) {
        return parsed;
      }
      return DEFAULT_REFRESH_INTERVAL_MS;
    } catch {
      return DEFAULT_REFRESH_INTERVAL_MS;
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

  // Inicializar estado desde la caché local para carga instantánea al recargar la página
  const [data, setData] = useState<ApiResponse>(() => {
    const cache = leerCacheLocal(urlWebhook);
    return cache ? cache.data : MOCK_DATA;
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cache = leerCacheLocal(urlWebhook);
    return cache ? new Date(cache.timestamp) : null;
  });

  const [countdown, setCountdown] = useState<number>(() => {
    const cache = leerCacheLocal(urlWebhook);
    if (cache) {
      const transcurrido = Date.now() - cache.timestamp;
      const restanteMs = refreshIntervalMs - transcurrido;
      if (restanteMs > 0) {
        return Math.ceil(restanteMs / 1000);
      }
    }
    return Math.ceil(refreshIntervalMs / 1000);
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [isFromCache, setIsFromCache] = useState<boolean>(() => Boolean(leerCacheLocal(urlWebhook)));

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

  const saveRefreshIntervalMs = useCallback((nuevoIntervaloMs: number) => {
    setRefreshIntervalMsState(nuevoIntervaloMs);
    setCountdown(Math.ceil(nuevoIntervaloMs / 1000));
    try {
      localStorage.setItem(STORAGE_KEY_INTERVAL, String(nuevoIntervaloMs));
    } catch (e) {
      console.warn('Error guardando intervalo de refresco en localStorage:', e);
    }
  }, []);

  // Función principal de obtención de datos (respeta caché local salvo forzado manual)
  const fetchData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!enabled) return;

      if (isDemoMode) {
        setLoading(true);
        const timer = setTimeout(() => {
          setData(MOCK_DATA);
          setError(null);
          setLastUpdated(new Date());
          setIsFromCache(false);
          setLoading(false);
          setCountdown(Math.ceil(refreshIntervalMs / 1000));
        }, forceRefresh ? 350 : 150);

        return () => clearTimeout(timer);
      }

      // Verificar caché local si no es una actualización forzada (botón Actualizar / timer expirado)
      if (!forceRefresh) {
        const cache = leerCacheLocal(urlWebhook);
        if (cache) {
          const edadMs = Date.now() - cache.timestamp;
          if (edadMs < refreshIntervalMs) {
            setData(cache.data);
            setLastUpdated(new Date(cache.timestamp));
            setIsFromCache(true);
            setError(null);
            setCountdown(Math.max(1, Math.ceil((refreshIntervalMs - edadMs) / 1000)));
            return;
          }
        }
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);

      // Modo producción con n8n (incluye header crítico para omitir pantalla de advertencia de ngrok)
      try {
        setError(null);
        const res = await fetch(urlWebhook, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();

        if (json && typeof json === 'object') {
          const solicitudes = Array.isArray(json.solicitudes) ? json.solicitudes : [];
          const log_errores = Array.isArray(json.log_errores) ? json.log_errores : [];
          const payload: ApiResponse = { solicitudes, log_errores };
          const ahora = Date.now();

          setData(payload);
          setError(null);
          setLastUpdated(new Date(ahora));
          setIsFromCache(false);
          guardarCacheLocal(payload, urlWebhook, ahora);
        } else {
          throw new Error('La respuesta de n8n no tiene el formato JSON esperado.');
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        console.error('Error al conectar con n8n:', err);
        setError('No se pudo conectar con n8n. Verifica la URL o el flujo');
      } finally {
        setLoading(false);
        setCountdown(Math.ceil(refreshIntervalMs / 1000));
      }
    },
    [enabled, isDemoMode, urlWebhook, refreshIntervalMs]
  );

  // Carga inicial (usa caché si está vigente; solo hace fetch si expiró o no existe)
  useEffect(() => {
    if (!enabled) return;
    fetchData(false);
  }, [enabled, fetchData]);

  // Temporizador de refresco automático (por defecto 5 minutos = 300,000 ms)
  useEffect(() => {
    if (!enabled || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(true);
          return Math.ceil(refreshIntervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, autoRefreshEnabled, fetchData, refreshIntervalMs]);

  return {
    data,
    loading,
    error,
    isDemoMode,
    setIsDemoMode,
    urlWebhook,
    saveUrlWebhook,
    refreshIntervalMs,
    saveRefreshIntervalMs,
    refetch: () => fetchData(true),
    lastUpdated,
    countdown,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    isFromCache,
  };
}
