import React from 'react';
import { AlertTriangle, RefreshCw, Sliders, PlayCircle } from 'lucide-react';

interface ErrorBannerProps {
  mensaje: string;
  onRetry: () => void;
  onOpenConfig: () => void;
  onActivateDemo: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  mensaje,
  onRetry,
  onOpenConfig,
  onActivateDemo,
}) => {
  return (
    <div
      role="alert"
      className="bg-red-50 border-y border-red-200 px-4 py-3 sm:px-6 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-red-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg text-red-700 shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900">Conexión con n8n fallida</h4>
            <p className="text-xs text-red-700">{mensaje}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-red-800 border border-red-300 rounded-md hover:bg-red-50 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
          <button
            onClick={onActivateDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 active:scale-95 transition-all shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Usar Datos Demo
          </button>
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 ml-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            Configurar URL
          </button>
        </div>
      </div>
    </div>
  );
};
