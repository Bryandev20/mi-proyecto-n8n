import React, { useState } from 'react';
import { X, Settings, Check, RefreshCw, AlertCircle, ExternalLink, Code } from 'lucide-react';
import { DEFAULT_WEBHOOK_URL, buildHeaders } from '../hooks/useOeraaeData';

interface PanelConfigProps {
  isOpen: boolean;
  onClose: () => void;
  urlActual: string;
  onSaveUrl: (url: string) => void;
}

export const PanelConfig: React.FC<PanelConfigProps> = ({
  isOpen,
  onClose,
  urlActual,
  onSaveUrl,
}) => {
  const [urlInput, setUrlInput] = useState(urlActual);
  const [testStatus, setTestStatus] = useState<{
    tipo: 'idle' | 'testing' | 'success' | 'error';
    mensaje?: string;
  }>({ tipo: 'idle' });
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  if (!isOpen) return null;

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const urlLimpia = urlInput.trim();
    if (!urlLimpia) return;

    try {
      onSaveUrl(urlLimpia);
      setGuardadoExitoso(true);
      setTimeout(() => {
        setGuardadoExitoso(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      alert('Ocurrió un error al guardar la URL en el navegador.');
    }
  };

  const handleRestaurarDefecto = () => {
    setUrlInput(DEFAULT_WEBHOOK_URL);
    setTestStatus({ tipo: 'idle' });
  };

  const handleProbarConexion = async () => {
    const url = urlInput.trim();
    if (!url || url.includes('TU-N8N')) {
      setTestStatus({
        tipo: 'error',
        mensaje: 'Debes ingresar un dominio real de n8n (reemplazar "TU-N8N").',
      });
      return;
    }

    setTestStatus({ tipo: 'testing', mensaje: 'Consultando endpoint n8n...' });

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json && (json.solicitudes || json.log_errores)) {
          setTestStatus({
            tipo: 'success',
            mensaje: `¡Conexión exitosa! (${(json.solicitudes || []).length} solicitudes, ${(json.log_errores || []).length} errores detectados).`,
          });
        } else {
          setTestStatus({
            tipo: 'success',
            mensaje: `El endpoint respondió con código 200, pero verifica la estructura JSON de salida.`,
          });
        }
      } else {
        setTestStatus({
          tipo: 'error',
          mensaje: `Respuesta HTTP ${resp.status}: ${resp.statusText}. Revisa si el nodo Webhook en n8n está activo.`,
        });
      }
    } catch (err: unknown) {
      setTestStatus({
        tipo: 'error',
        mensaje: `No se pudo conectar: ${(err as Error)?.message || 'Error de red o CORS'}. Asegúrate de habilitar CORS en n8n (N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS o cabeceras Access-Control-Allow-Origin: *).`,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#1E3A5F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-200 rounded-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 id="config-title" className="text-base font-bold leading-tight">
                Configuración del Webhook n8n
              </h3>
              <p className="text-xs text-slate-300">
                Apunta el dashboard al webhook de tu flujo de producción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label htmlFor="url-webhook" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL del Webhook (Método GET):
            </label>
            <div className="flex items-center gap-2">
              <input
                id="url-webhook"
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://n8n.tu-servidor.com/webhook/listar-solicitudes"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all shadow-xs"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleRestaurarDefecto}
                className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
              >
                Restaurar valor predeterminado
              </button>

              <button
                type="button"
                onClick={handleProbarConexion}
                disabled={testStatus.tipo === 'testing'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-300 disabled:opacity-50"
              >
                {testStatus.tipo === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                Probar Conexión
              </button>
            </div>
          </div>

          {/* Estado de la prueba */}
          {testStatus.tipo !== 'idle' && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testStatus.tipo === 'testing'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : testStatus.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testStatus.tipo === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : testStatus.tipo === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{testStatus.mensaje}</span>
            </div>
          )}

          {/* Información del esquema esperado */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <Code className="w-4 h-4 text-slate-500" />
              Estructura JSON esperada desde el nodo "Respond to Webhook":
            </div>
            <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-md overflow-x-auto leading-relaxed max-h-40">
{`{
  "solicitudes": [
    {
      "CODALUMNO": "20240001A",
      "ALUMNO": "PEREZ JUAN",
      "ESPECIALIDAD": "M3",
      "CELULAR": "51948702083",
      "EMAIL": "correo@ejemplo.com",
      "COD CURSO": "MC116",
      "SECCURSO": "B",
      "CODITIPO": "ES",
      "OBSERVACION": "OK",
      "NOTIFICADO": "SI",
      "CANAL_ENVIO": "Email",
      "FECHA_ENVIO": "2026-10-12 22:00:35"
    }
  ],
  "log_errores": [
    {
      "FECHA_HORA": "2026-10-12 22:00:41",
      "NODO_FALLIDO": "Ruta WAHA",
      "MENSAJE_ERROR": "500 - Error de Puppeteer...",
      "ALUMNO": "TOMA EDWIN",
      "CONTACTO_DESTINO": "correo_falso@...",
      "CANAL": "WHATSAPP"
    }
  ]
}`}
            </pre>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#1E3A5F] text-white rounded-md hover:bg-[#162C48] active:scale-95 transition-all shadow-sm"
            >
              {guardadoExitoso ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
