import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Solicitud, FiltroCanal, FiltroEstado, EstadoSolicitud } from '../types';
import { getEstado, normalizarCanal, descargarCSV } from '../utils/helpers';

interface TablaSolicitudesProps {
  solicitudes: Solicitud[];
  loading: boolean;
}

export const TablaSolicitudes: React.FC<TablaSolicitudesProps> = ({
  solicitudes,
  loading,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos');
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Filtrado de solicitudes
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((item) => {
      // Filtro de texto (Alumno o Código)
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideAlumno = (item.ALUMNO || '').toLowerCase().includes(query);
        const coincideCodigo = (item.CODALUMNO || '').toLowerCase().includes(query);
        const coincideCurso = (item['COD CURSO'] || '').toLowerCase().includes(query);
        if (!coincideAlumno && !coincideCodigo && !coincideCurso) {
          return false;
        }
      }

      // Filtro por canal
      if (filtroCanal !== 'Todos') {
        const canalNorm = normalizarCanal(item.CANAL_ENVIO);
        if (canalNorm !== filtroCanal) {
          return false;
        }
      }

      // Filtro por estado
      if (filtroEstado !== 'Todos') {
        const estado = getEstado(item);
        if (filtroEstado === 'Enviado' && estado !== 'Enviado') return false;
        if (filtroEstado === 'Pendiente' && estado !== 'Pendiente') return false;
        if (filtroEstado === 'No hay vacantes' && estado !== 'Observado') return false;
      }

      return true;
    });
  }, [solicitudes, busqueda, filtroCanal, filtroEstado]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(solicitudesFiltradas.length / tamanoPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);

  const solicitudesPaginadas = useMemo(() => {
    const inicio = (paginaAjustada - 1) * tamanoPagina;
    return solicitudesFiltradas.slice(inicio, inicio + tamanoPagina);
  }, [solicitudesFiltradas, paginaAjustada, tamanoPagina]);

  // Manejador de copiado rápido
  const handleCopiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 1500);
  };

  // Descarga CSV de la vista filtrada
  const handleDescargarCsv = () => {
    const filasParaExportar = solicitudesFiltradas.map((s) => ({
      'Código Alumno': s.CODALUMNO,
      'Alumno': s.ALUMNO,
      'Especialidad': s.ESPECIALIDAD || '',
      'Celular': s.CELULAR,
      'Email': s.EMAIL,
      'Código Curso': s['COD CURSO'],
      'Sección': s.SECCURSO,
      'Tipo': s.CODITIPO,
      'Observación': s.OBSERVACION,
      'Notificado': s.NOTIFICADO,
      'Estado Visual': getEstado(s),
      'Canal de Envío': s.CANAL_ENVIO,
      'Fecha Envío': s.FECHA_ENVIO || '',
    }));

    descargarCSV('solicitudes_oeraae', filasParaExportar);
  };

  // Renderizador de Badge de Estado
  const renderBadgeEstado = (estado: EstadoSolicitud, valorOriginal: string) => {
    if (estado === 'Enviado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2E9E5B]/15 text-[#1b6d3b] border border-[#2E9E5B]/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Enviado ({valorOriginal || 'SI'})
        </span>
      );
    }
    if (estado === 'Observado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D64545]/15 text-[#a82222] border border-[#D64545]/30">
          <AlertCircle className="w-3.5 h-3.5" />
          {valorOriginal || 'No hay vacantes'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0A100]/15 text-[#966b00] border border-[#E0A100]/30">
        <Clock className="w-3.5 h-3.5" />
        Pendiente
      </span>
    );
  };

  // Renderizador de Badge de Canal
  const renderBadgeCanal = (canalStr: string) => {
    const canal = normalizarCanal(canalStr);
    if (canal === 'WhatsApp') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/30">
          <MessageSquare className="w-3 h-3" />
          WhatsApp
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#EA4335]/15 text-[#C5221F] border border-[#EA4335]/30">
        <Mail className="w-3 h-3" />
        Gmail
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
              placeholder="Buscar por Alumno, Código o Curso..."
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

          {/* Filtros Dropdowns y Botón Exportar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filtro Canal */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filtro-canal" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Canal:
              </label>
              <select
                id="filtro-canal"
                value={filtroCanal}
                onChange={(e) => {
                  setFiltroCanal(e.target.value as FiltroCanal);
                  setPaginaActual(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] shadow-xs cursor-pointer"
              >
                <option value="Todos">Todos los Canales</option>
                <option value="Email">Gmail (Email)</option>
                <option value="WhatsApp">WhatsApp (WAHA)</option>
              </select>
            </div>

            {/* Filtro Estado */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filtro-estado" className="text-xs font-bold text-slate-600">
                Estado:
              </label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value as FiltroEstado);
                  setPaginaActual(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] shadow-xs cursor-pointer"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Enviado">Enviado (SI)</option>
                <option value="Pendiente">Pendiente (Vacío)</option>
                <option value="No hay vacantes">No hay vacantes</option>
              </select>
            </div>

            {/* Selector de Paginación */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600">Filas:</span>
              <select
                value={tamanoPagina}
                onChange={(e) => {
                  setTamanoPagina(Number(e.target.value));
                  setPaginaActual(1);
                }}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] shadow-xs cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>

            {/* Botón Descargar CSV */}
            <button
              onClick={handleDescargarCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162C48] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>

        {/* Resumen de filtros activos */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Mostrando <span className="font-bold text-slate-800 tabular-nums">{solicitudesFiltradas.length}</span> de{' '}
            <span className="font-bold text-slate-800 tabular-nums">{solicitudes.length}</span> solicitudes registradas
          </div>
          {(busqueda || filtroCanal !== 'Todos' || filtroEstado !== 'Todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCanal('Todos');
                setFiltroEstado('Todos');
                setPaginaActual(1);
              }}
              className="text-[#1E3A5F] hover:underline font-semibold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Fecha Envío</th>
              <th className="py-3 px-3">Código</th>
              <th className="py-3 px-4">Alumno</th>
              <th className="py-3 px-3">Contacto (Celular / Correo)</th>
              <th className="py-3 px-3">Curso & Sec.</th>
              <th className="py-3 px-2 text-center">Tipo</th>
              <th className="py-3 px-4">Observación</th>
              <th className="py-3 px-3 text-center">Notificado</th>
              <th className="py-3 px-3 text-center">Canal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              // Esqueletos de carga
              Array.from({ length: tamanoPagina }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-24" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-16" /></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-36" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-28" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-20" /></td>
                  <td className="py-3.5 px-2"><div className="h-4 bg-slate-200 rounded-sm w-8 mx-auto" /></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded-sm w-32" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-20 mx-auto" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded-sm w-16 mx-auto" /></td>
                </tr>
              ))
            ) : solicitudesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron solicitudes</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Intenta ajustar el texto de búsqueda o los filtros de canal y estado.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              solicitudesPaginadas.map((item, index) => {
                const estado = getEstado(item);
                const celId = `cel-${index}`;
                const emailId = `em-${index}`;

                return (
                  <tr
                    key={`${item.CODALUMNO}-${index}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Fecha de Envío */}
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {item.FECHA_ENVIO ? (
                        item.FECHA_ENVIO
                      ) : (
                        <span className="text-slate-400 italic">Sin fecha</span>
                      )}
                    </td>

                    {/* Código Alumno */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.CODALUMNO}
                      {item.ESPECIALIDAD && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Esp: {item.ESPECIALIDAD}
                        </span>
                      )}
                    </td>

                    {/* Alumno */}
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate" title={item.ALUMNO}>
                      {item.ALUMNO}
                    </td>

                    {/* Contacto: Celular y Correo */}
                    <td className="py-3 px-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="font-mono tabular-nums">{item.CELULAR || '—'}</span>
                        {item.CELULAR && (
                          <button
                            onClick={() => handleCopiarTexto(item.CELULAR, celId)}
                            title="Copiar celular"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {copiadoId === celId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[190px]">
                        <span title={item.EMAIL}>{item.EMAIL || '—'}</span>
                        {item.EMAIL && (
                          <button
                            onClick={() => handleCopiarTexto(item.EMAIL, emailId)}
                            title="Copiar correo"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {copiadoId === emailId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Curso & Sección */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800">{item['COD CURSO']}</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono font-semibold">
                        Sec {item.SECCURSO || '-'}
                      </span>
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold rounded-sm text-[11px]">
                        {item.CODITIPO || '—'}
                      </span>
                    </td>

                    {/* Observación */}
                    <td className="py-3 px-4 text-slate-700 max-w-[220px]" title={item.OBSERVACION}>
                      <span className="line-clamp-2 leading-snug">{item.OBSERVACION || '—'}</span>
                    </td>

                    {/* Notificado (Estado Visual) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {renderBadgeEstado(estado, item.NOTIFICADO)}
                    </td>

                    {/* Canal de Envío */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {renderBadgeCanal(item.CANAL_ENVIO)}
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

          {/* Selector de número de página si hay varias */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
              // Centrar alrededor de la página actual
              let numPag = i + 1;
              if (totalPaginas > 5) {
                if (paginaAjustada > 3) {
                  numPag = paginaAjustada - 2 + i;
                  if (numPag > totalPaginas) numPag = totalPaginas - 4 + i;
                }
              }

              return (
                <button
                  key={numPag}
                  onClick={() => setPaginaActual(numPag)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md font-mono text-xs transition-colors tabular-nums ${
                    paginaAjustada === numPag
                      ? 'bg-[#1E3A5F] text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {numPag}
                </button>
              );
            })}
          </div>

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
