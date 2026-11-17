/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TabActiva, LogError } from './types';
import { useOeraaeData } from './hooks/useOeraaeData';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { DashboardView } from './components/DashboardView';
import { TablaSolicitudes } from './components/TablaSolicitudes';
import { TablaErrores } from './components/TablaErrores';
import { ModalDetalle } from './components/ModalDetalle';
import { PanelConfig } from './components/PanelConfig';

const STORAGE_KEY_DEMO_USER = 'oeraae_demo_worker_email';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (!isSupabaseConfigured) {
      try {
        return sessionStorage.getItem(STORAGE_KEY_DEMO_USER);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [authChecking, setAuthChecking] = useState<boolean>(isSupabaseConfigured);

  const [tabActiva, setTabActiva] = useState<TabActiva>('dashboard');
  const [errorSeleccionado, setErrorSeleccionado] = useState<LogError | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Verificar sesión activa de Supabase y escuchar cambios (login / logout)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthChecking(false);
      return;
    }

    let activo = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!activo) return;
        setUserEmail(session?.user?.email ?? null);
        setAuthChecking(false);
      })
      .catch((err) => {
        console.error('Error verificando sesión en Supabase:', err);
        if (activo) setAuthChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setAuthChecking(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = Boolean(userEmail);

  // Solo consulta datos / activa temporizador si el trabajador está autenticado
  const {
    data,
    loading,
    error,
    isDemoMode,
    setIsDemoMode,
    urlWebhook,
    saveUrlWebhook,
    refreshIntervalMs,
    saveRefreshIntervalMs,
    refetch,
    lastUpdated,
    countdown,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    isFromCache,
  } = useOeraaeData(isAuthenticated);

  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      try {
        sessionStorage.removeItem(STORAGE_KEY_DEMO_USER);
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
    setUserEmail(null);
    setTabActiva('dashboard');
  };

  const handleDemoLogin = (email: string) => {
    try {
      sessionStorage.setItem(STORAGE_KEY_DEMO_USER, email);
    } catch {
      // Ignorar errores de almacenamiento
    }
    setUserEmail(email);
  };

  // Pantalla de verificación inicial de sesión
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#1E3A5F]/20 border-t-[#1E3A5F] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">
          Verificando sesión institucional...
        </p>
      </div>
    );
  }

  // Protección de ruta: si no ha iniciado sesión, redirige al Login
  if (!isAuthenticated || !userEmail) {
    return <Login onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col text-slate-800 antialiased selection:bg-[#1E3A5F] selection:text-white">
      {/* Cabecera Principal Institucional */}
      <Header
        tabActiva={tabActiva}
        onCambiarTab={setTabActiva}
        isDemoMode={isDemoMode}
        onToggleDemoMode={setIsDemoMode}
        onAbrirConfig={() => setIsConfigOpen(true)}
        onRefreshManual={refetch}
        isLoading={loading}
        totalErrores={data.log_errores.length}
        totalSolicitudes={data.solicitudes.length}
        lastUpdated={lastUpdated}
        countdown={countdown}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        userEmail={userEmail}
        onLogout={handleLogout}
        isFromCache={isFromCache}
      />

      {/* Banner de Error si falla la conexión con n8n */}
      {error && !isDemoMode && (
        <ErrorBanner
          mensaje={error}
          onRetry={refetch}
          onOpenConfig={() => setIsConfigOpen(true)}
          onActivateDemo={() => setIsDemoMode(true)}
        />
      )}

      {/* Contenido Principal con Contenedor Centralizado */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tabActiva === 'dashboard' && (
          <DashboardView
            solicitudes={data.solicitudes}
            logErrores={data.log_errores}
            onIrASolicitudes={() => setTabActiva('solicitudes')}
            onIrAErrores={() => setTabActiva('errores')}
          />
        )}

        {tabActiva === 'solicitudes' && (
          <TablaSolicitudes
            solicitudes={data.solicitudes}
            loading={loading}
          />
        )}

        {tabActiva === 'errores' && (
          <TablaErrores
            logErrores={data.log_errores}
            loading={loading}
            onVerDetalle={(item) => setErrorSeleccionado(item)}
          />
        )}
      </main>

      {/* Pie Institucional Discreto */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">OERAAE</span>
            <span aria-hidden="true">·</span>
            <span>Sistema Integrado de Notificaciones Automatizadas</span>
            <span aria-hidden="true">·</span>
            <span>Gmail API & WAHA WhatsApp</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Motor n8n Webhook</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-[#1E3A5F] hover:underline font-medium"
            >
              Configuración de Endpoint
            </button>
          </div>
        </div>
      </footer>

      {/* Modal para Ver Detalle del Error (JSON / Traza) */}
      <ModalDetalle
        errorItem={errorSeleccionado}
        onClose={() => setErrorSeleccionado(null)}
      />

      {/* Modal para Configuración de Webhook URL e Intervalo de Refresco */}
      <PanelConfig
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        urlActual={urlWebhook}
        onSaveUrl={saveUrlWebhook}
        intervaloActualMs={refreshIntervalMs}
        onSaveIntervalo={saveRefreshIntervalMs}
      />
    </div>
  );
}
