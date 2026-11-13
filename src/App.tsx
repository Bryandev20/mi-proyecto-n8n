/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TabActiva, LogError } from './types';
import { useOeraaeData } from './hooks/useOeraaeData';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { DashboardView } from './components/DashboardView';
import { TablaSolicitudes } from './components/TablaSolicitudes';
import { TablaErrores } from './components/TablaErrores';
import { ModalDetalle } from './components/ModalDetalle';
import { PanelConfig } from './components/PanelConfig';

export default function App() {
  const [tabActiva, setTabActiva] = useState<TabActiva>('dashboard');
  const [errorSeleccionado, setErrorSeleccionado] = useState<LogError | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const {
    data,
    loading,
    error,
    isDemoMode,
    setIsDemoMode,
    urlWebhook,
    saveUrlWebhook,
    refetch,
    lastUpdated,
    countdown,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
  } = useOeraaeData();

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

      {/* Modal para Configuración de Webhook URL */}
      <PanelConfig
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        urlActual={urlWebhook}
        onSaveUrl={saveUrlWebhook}
      />
    </div>
  );
}
