import React, { useState } from 'react';
import { X, Copy, Check, AlertCircle, Mail, MessageSquare, Terminal } from 'lucide-react';
import { LogError } from '../types';
import { normalizarCanal } from '../utils/helpers';

interface ModalDetalleProps {
  errorItem: LogError | null;
  onClose: () => void;
}

export const ModalDetalle: React.FC<ModalDetalleProps> = ({ errorItem, onClose }) => {
  const [copiado, setCopiado] = useState(false);

  if (!errorItem) return null;

  const canalNormalizado = normalizarCanal(errorItem.CANAL);
  const esWhatsapp = canalNormalizado === 'WhatsApp';

  // Intentar parsear el mensaje si contiene JSON para formatearlo bonito
  let mensajeFormateado = errorItem.MENSAJE_ERROR;
  let esJsonValido = false;

  try {
    // Si el mensaje tiene formato "500 - {...}" o directamente "{...}"
    const matchJson = errorItem.MENSAJE_ERROR.match(/\{[\s\S]*\}/);
    if (matchJson) {
      const parsed = JSON.parse(matchJson[0]);
      mensajeFormateado = JSON.stringify(parsed, null, 2);
      esJsonValido = true;
    }
  } catch {
    // Si no es JSON puro, se muestra como texto regular
    esJsonValido = false;
  }

  const copiarAlPortapapeles = async () => {
    try {
      await navigator.clipboard.writeText(errorItem.MENSAJE_ERROR);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-[#1E3A5F] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-500/20 text-red-300 rounded-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-titulo" className="text-base font-bold leading-tight">
                Detalle del Error de Notificación
              </h3>
              <p className="text-xs text-slate-300">
                Registro del nodo n8n para diagnóstico técnico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadatos del error */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium block">Fecha y Hora:</span>
              <span className="font-mono text-slate-800 font-semibold">{errorItem.FECHA_HORA}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Canal Involucrado:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded-md font-semibold text-xs ${
                  esWhatsapp
                    ? 'bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/30'
                    : 'bg-[#EA4335]/15 text-[#C5221F] border border-[#EA4335]/30'
                }`}
              >
                {esWhatsapp ? <MessageSquare className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                {canalNormalizado} ({errorItem.CANAL})
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Nodo Fallido en n8n:</span>
              <span className="font-semibold text-slate-900">{errorItem.NODO_FALLIDO}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Alumno Afectado:</span>
              <span className="font-semibold text-slate-900">{errorItem.ALUMNO || 'No especificado'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 font-medium block">Contacto de Destino:</span>
              <span className="font-mono text-slate-800">{errorItem.CONTACTO_DESTINO || '—'}</span>
            </div>
          </div>

          {/* Mensaje de Error Completo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Terminal className="w-4 h-4 text-slate-500" />
                Traza y Respuesta del Servicio (WAHA / Puppeteer / Gmail):
              </label>
              <button
                type="button"
                onClick={copiarAlPortapapeles}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors border border-slate-300 active:scale-95"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-64 leading-relaxed border border-slate-800 selection:bg-blue-600 selection:text-white">
                {mensajeFormateado}
              </pre>
            </div>
            {esJsonValido && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                * El mensaje ha sido formateado automáticamente como JSON para facilitar su lectura.
              </p>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-[#1E3A5F] text-white rounded-md hover:bg-[#162C48] transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
