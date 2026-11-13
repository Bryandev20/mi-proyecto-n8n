import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Download,
  Filter,
  Search,
  Mail,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { LogError, FiltroCanal } from '../types';
import { normalizarCanal, descargarCSV } from '../utils/helpers';

interface TablaErroresProps {
  logErrores: LogError[];
  loading: boolean;
  onVerDetalle: (error: LogError) => void;
}

export const TablaErrores: React.FC<TablaErroresProps> = ({
  logErrores,
  loading,
  onVerDetalle,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const tamanoPagina = 10;

  // Filtrado de logs de error
  const erroresFiltrados = useMemo(() => {
    return logErrores.filter((err) => {
      // Filtro de canal
      if (filtroCanal !== 'Todos') {
        const canalNorm = normalizarCanal(err.CANAL);
        if (canalNorm !== filtroCanal) {
          return false;
        }
      }

      // Filtro de texto (Alumno, Nodo o Contacto o Mensaje)
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const enAlumno = (err.ALUMNO || '').toLowerCase().includes(q);
        const enNodo = (err.NODO_FALLIDO || '').toLowerCase().includes(q);
        const enContacto = (err.CONTACTO_DESTINO || '').toLowerCase().includes(q);
        const enMensaje = (err.MENSAJE_ERROR || '').toLowerCase().includes(q);
        if (!enAlumno && !enNodo && !enContacto && !enMensaje) {
          return false;
        }
      }

      return true;
    });
  }, [logErrores, filtroCanal, busqueda]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(erroresFiltrados.length / tamanoPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);

  const erroresPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * tamanoPagina;
    return erroresFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [erroresFiltrados, paginaAjustada, tamanoPagina]);

  // Exportar errores a CSV
  const handleDescargarCsv = () => {
    const exportData = erroresFiltrados.map((e) => ({
      'Fecha y Hora': e.FECHA_HORA,
      'Canal': e.CANAL,
      'Nodo Fallido': e.NODO_FALLIDO,
      'Alumno': e.ALUMNO,
      'Contacto Destino': e.CONTACTO_DESTINO,
      'Mensaje de Error': e.MENSAJE_ERROR,
    }));
    descargarCSV('log_errores_n8n_oeraae', exportData);
  };

  const renderBadgeCanal = (canalStr: string) => {
    const canal = normalizarCanal(canalStr);
    if (canal === 'WhatsApp') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/30">
          <MessageSquare className="w-3.5 h-3.5" />
          WhatsApp (WAHA)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#EA4335]/15 text-[#C5221F] border border-[#EA4335]/30">
        <Mail className="w-3.5 h-3.5" />
        Gmail (Email)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Controles de Filtros y Búsqueda */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por Nodo, Alumno, Contacto o Error..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all shadow-xs"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros Dropdowns y Exportar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro Canal Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filtro-canal-error" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filtrar Canal:
              </label>
              <select
                id="filtro-canal-error"
                value={filtroCanal}
                onChange={(e) => {
                  setFiltroCanal(e.target.value as FiltroCanal);
                  setPaginaActual(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] shadow-xs cursor-pointer"
              >
                <option value="Todos">Todos los Canales</option>
                <option value="WhatsApp">Solo WhatsApp (WAHA)</option>
                <option value="Email">Solo Gmail (Email)</option>
              </select>
            </div>

            {/* Botón Descargar CSV de Errores */}
            <button
              onClick={handleDescargarCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162C48] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV de Errores</span>
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Mostrando <span className="font-bold text-red-700 tabular-nums">{erroresFiltrados.length}</span> fallos de{' '}
            <span className="font-bold text-slate-800 tabular-nums">{logErrores.length}</span> errores registrados en n8n
          </div>
          {(busqueda || filtroCanal !== 'Todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCanal('Todos');
                setPaginaActual(1);
              }}
              className="text-[#1E3A5F] hover:underline font-semibold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Fecha / Hora</th>
              <th className="py-3 px-3">Canal</th>
              <th className="py-3 px-3">Nodo Fallido</th>
              <th className="py-3 px-4">Alumno</th>
              <th className="py-3 px-3">Contacto Destino</th>
              <th className="py-3 px-4">Mensaje de Error</th>
              <th className="py-3 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-err-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-28" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-20" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-24" /></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-32" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-28" /></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-48" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-16 mx-auto" /></td>
                </tr>
              ))
            ) : erroresPaginados.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="font-semibold text-slate-700">No hay errores que coincidan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No se detectaron fallos en los canales con los filtros actuales.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              erroresPaginados.map((item, index) => {
                // Truncar mensaje corto para vista en tabla
                const mensajeCorto = item.MENSAJE_ERROR
                  ? item.MENSAJE_ERROR.length > 70
                    ? item.MENSAJE_ERROR.slice(0, 70) + '...'
                    : item.MENSAJE_ERROR
                  : 'Sin detalle de error';

                return (
                  <tr
                    key={`err-${index}`}
                    className="hover:bg-red-50/30 transition-colors"
                  >
                    {/* Fecha y Hora */}
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {item.FECHA_HORA}
                    </td>

                    {/* Canal */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderBadgeCanal(item.CANAL)}
                    </td>

                    {/* Nodo Fallido */}
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap flex items-center gap-1.5 pt-3.5">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.NODO_FALLIDO || 'Nodo n8n'}</span>
                    </td>

                    {/* Alumno */}
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[180px] truncate" title={item.ALUMNO}>
                      {item.ALUMNO || 'No especificado'}
                    </td>

                    {/* Contacto Destino */}
                    <td className="py-3 px-3 font-mono text-slate-700 max-w-[160px] truncate" title={item.CONTACTO_DESTINO}>
                      {item.CONTACTO_DESTINO || '—'}
                    </td>

                    {/* Mensaje de Error (resumen) */}
                    <td className="py-3 px-4 text-red-900 font-mono text-[11px] max-w-[260px]">
                      <span className="line-clamp-2 bg-red-50 px-2 py-1 rounded-sm border border-red-200/60 block" title={item.MENSAJE_ERROR}>
                        {mensajeCorto}
                      </span>
                    </td>

                    {/* Botón Ver Detalle */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onVerDetalle(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1E3A5F] hover:text-white bg-blue-50 hover:bg-[#1E3A5F] rounded-md transition-all border border-blue-200 active:scale-95 cursor-pointer"
                        title="Ver traza completa y JSON del error"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie con Paginación */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-600">
          Página <span className="font-bold text-slate-800 tabular-nums">{paginaAjustada}</span> de{' '}
          <span className="font-bold text-slate-800 tabular-nums">{totalPaginas}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            disabled={paginaAjustada <= 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>

          <button
            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAjustada >= totalPaginas || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
          >
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
