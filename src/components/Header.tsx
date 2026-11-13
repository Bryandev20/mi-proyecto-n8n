import React from 'react';
import {
  Settings,
  RefreshCw,
  LayoutDashboard,
  FileSpreadsheet,
  AlertOctagon,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { TabActiva } from '../types';

interface HeaderProps {
  tabActiva: TabActiva;
  onCambiarTab: (tab: TabActiva) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  onAbrirConfig: () => void;
  onRefreshManual: () => void;
  isLoading: boolean;
  totalErrores: number;
  totalSolicitudes: number;
  lastUpdated: Date | null;
  countdown: number;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabActiva,
  onCambiarTab,
  isDemoMode,
  onToggleDemoMode,
  onAbrirConfig,
  onRefreshManual,
  isLoading,
  totalErrores,
  totalSolicitudes,
  lastUpdated,
  countdown,
  autoRefreshEnabled,
  onToggleAutoRefresh,
}) => {
  return (
    <header className="bg-[#1E3A5F] text-white shadow-md border-b border-[#162C48] sticky top-0 z-40">
      {/* Barra superior de estado institucional y controles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Identidad Institucional */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-lg text-white shadow-inner tracking-wider">
            OE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                Panel de Solicitudes OERAAE
              </h1>
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  MODO DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200">
              Monitoreo y despacho multicanal n8n · Gmail (Email) y WhatsApp (WAHA)
            </p>
          </div>
        </div>

        {/* Controles de Estado, Modo Demo, Auto-refresco y Configuración */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
          {/* Switch Modo Demo */}
          <div className="flex items-center bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/15 transition-colors">
            <label htmlFor="demo-mode-switch" className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-blue-100 font-medium">Modo Demo</span>
              <input
                id="demo-mode-switch"
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => onToggleDemoMode(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  isDemoMode ? 'bg-amber-400' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isDemoMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Temporizador / Auto-refresco */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 text-blue-100">
            <Clock className="w-3.5 h-3.5 text-blue-300" />
            <button
              onClick={onToggleAutoRefresh}
              title={autoRefreshEnabled ? 'Pausar refresco automático' : 'Activar refresco cada 30s'}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {autoRefreshEnabled ? (
                <span>Refresco: <span className="font-mono font-bold text-white tabular-nums">{countdown}s</span></span>
              ) : (
                <span className="text-amber-200">Pausado</span>
              )}
            </button>
          </div>

          {/* Botón Refrescar Manual */}
          <button
            onClick={onRefreshManual}
            disabled={isLoading}
            title="Refrescar datos manualmente ahora"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-medium rounded-lg shadow-xs transition-all border border-blue-400/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Botón de Configuración (Engranaje) */}
          <button
            onClick={onAbrirConfig}
            title="Configurar URL del Webhook n8n"
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg transition-colors border border-white/15"
            aria-label="Abrir configuración de webhook"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación Institucionales */}
      <div className="bg-[#162C48] border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Pestañas principales">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => onCambiarTab('dashboard')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tabActiva === 'dashboard'
                  ? 'border-blue-400 text-white bg-white/5'
                  : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Tab 2: Solicitudes */}
            <button
              onClick={() => onCambiarTab('solicitudes')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tabActiva === 'solicitudes'
                  ? 'border-blue-400 text-white bg-white/5'
                  : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Solicitudes</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 bg-blue-900/60 rounded-full text-blue-200 border border-blue-400/30 tabular-nums">
                {totalSolicitudes}
              </span>
            </button>

            {/* Tab 3: Log de Errores */}
            <button
              onClick={() => onCambiarTab('errores')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tabActiva === 'errores'
                  ? 'border-red-400 text-white bg-white/5'
                  : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Log de Errores</span>
              {totalErrores > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.2 bg-red-600 text-white rounded-full font-bold tabular-nums">
                  {totalErrores}
                </span>
              )}
            </button>
          </nav>

          {/* Indicador de última sincronización */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-blue-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              Última sincronización:{' '}
              <span className="font-mono text-white tabular-nums">
                {lastUpdated ? lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
