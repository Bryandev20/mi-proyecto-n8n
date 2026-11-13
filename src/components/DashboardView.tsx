import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Send,
  Clock,
  AlertTriangle,
  Mail,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  AlertOctagon,
} from 'lucide-react';
import { Solicitud, LogError, FiltroRangoFecha } from '../types';
import { getEstado, normalizarCanal, estaEnRango } from '../utils/helpers';

interface DashboardViewProps {
  solicitudes: Solicitud[];
  logErrores: LogError[];
  onIrASolicitudes: () => void;
  onIrAErrores: () => void;
}

const COLORES_ESTADO = {
  Enviado: '#2E9E5B',
  Pendiente: '#E0A100',
  Observado: '#D64545',
};

const COLOR_EMAIL = '#EA4335';
const COLOR_WHATSAPP = '#25D366';

export const DashboardView: React.FC<DashboardViewProps> = ({
  solicitudes,
  logErrores,
  onIrASolicitudes,
  onIrAErrores,
}) => {
  const [rangoFecha, setRangoFecha] = useState<FiltroRangoFecha>('todo');

  // Filtrado reactivo según el rango de fechas seleccionado
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      // Si no tiene FECHA_ENVIO pero está pendiente, lo consideramos en el filtro "todo" o según corresponda
      if (!s.FECHA_ENVIO) return rangoFecha === 'todo';
      return estaEnRango(s.FECHA_ENVIO, rangoFecha);
    });
  }, [solicitudes, rangoFecha]);

  const erroresFiltrados = useMemo(() => {
    return logErrores.filter((e) => estaEnRango(e.FECHA_HORA, rangoFecha));
  }, [logErrores, rangoFecha]);

  // Cálculos de KPIs Generales
  const kpis = useMemo(() => {
    let enviados = 0;
    let pendientes = 0;
    let observados = 0;

    let totalEmail = 0;
    let enviadosEmail = 0;

    let totalWhatsapp = 0;
    let enviadosWhatsapp = 0;

    solicitudesFiltradas.forEach((s) => {
      const estado = getEstado(s);
      const canal = normalizarCanal(s.CANAL_ENVIO);

      if (estado === 'Enviado') {
        enviados++;
      } else if (estado === 'Observado') {
        observados++;
      } else {
        pendientes++;
      }

      if (canal === 'Email') {
        totalEmail++;
        if (estado === 'Enviado') enviadosEmail++;
      } else {
        totalWhatsapp++;
        if (estado === 'Enviado') enviadosWhatsapp++;
      }
    });

    const total = solicitudesFiltradas.length;
    const tasaExitoEmail = totalEmail > 0 ? Math.round((enviadosEmail / totalEmail) * 100) : 0;
    const tasaExitoWhatsapp = totalWhatsapp > 0 ? Math.round((enviadosWhatsapp / totalWhatsapp) * 100) : 0;

    return {
      total,
      enviados,
      pendientes,
      observados,
      totalErrores: erroresFiltrados.length,
      email: {
        total: totalEmail,
        enviados: enviadosEmail,
        tasa: tasaExitoEmail,
      },
      whatsapp: {
        total: totalWhatsapp,
        enviados: enviadosWhatsapp,
        tasa: tasaExitoWhatsapp,
      },
    };
  }, [solicitudesFiltradas, erroresFiltrados]);

  // Datos para Gráfico 1: Barras Agrupadas por Canal (Email vs WhatsApp)
  const datosBarrasCanal = useMemo(() => {
    let emailEnv = 0, emailPen = 0, emailObs = 0;
    let wahaEnv = 0, wahaPen = 0, wahaObs = 0;

    solicitudesFiltradas.forEach((s) => {
      const estado = getEstado(s);
      const canal = normalizarCanal(s.CANAL_ENVIO);
      if (canal === 'Email') {
        if (estado === 'Enviado') emailEnv++;
        else if (estado === 'Observado') emailObs++;
        else emailPen++;
      } else {
        if (estado === 'Enviado') wahaEnv++;
        else if (estado === 'Observado') wahaObs++;
        else wahaPen++;
      }
    });

    return [
      {
        canal: 'Gmail (Email)',
        Enviados: emailEnv,
        Pendientes: emailPen,
        'No hay vacantes': emailObs,
      },
      {
        canal: 'WhatsApp (WAHA)',
        Enviados: wahaEnv,
        Pendientes: wahaPen,
        'No hay vacantes': wahaObs,
      },
    ];
  }, [solicitudesFiltradas]);

  // Datos para Gráfico 2: Dona de Distribución de Estados
  const datosDonaEstados = useMemo(() => {
    return [
      { name: 'Enviados', value: kpis.enviados, color: COLORES_ESTADO.Enviado },
      { name: 'Pendientes', value: kpis.pendientes, color: COLORES_ESTADO.Pendiente },
      { name: 'No hay vacantes', value: kpis.observados, color: COLORES_ESTADO.Observado },
    ].filter((item) => item.value > 0);
  }, [kpis]);

  // Datos para Gráfico 3: Líneas de Solicitudes por Día (separado por canal)
  const datosLineasDias = useMemo(() => {
    const mapaDias: Record<string, { fecha: string; Email: number; WhatsApp: number; total: number }> = {};

    solicitudesFiltradas.forEach((s) => {
      const fechaBase = s.FECHA_ENVIO ? s.FECHA_ENVIO.slice(0, 10) : 'Sin fecha';
      if (!mapaDias[fechaBase]) {
        mapaDias[fechaBase] = { fecha: fechaBase, Email: 0, WhatsApp: 0, total: 0 };
      }
      const canal = normalizarCanal(s.CANAL_ENVIO);
      if (canal === 'Email') {
        mapaDias[fechaBase].Email++;
      } else {
        mapaDias[fechaBase].WhatsApp++;
      }
      mapaDias[fechaBase].total++;
    });

    return Object.values(mapaDias)
      .filter((d) => d.fecha !== 'Sin fecha')
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [solicitudesFiltradas]);

  // Datos para Gráfico 4: Top 5 Errores agrupados por CANAL y NODO_FALLIDO
  const datosTopErrores = useMemo(() => {
    const mapa: Record<string, { nombre: string; canal: string; nodo: string; cantidad: number }> = {};

    erroresFiltrados.forEach((e) => {
      const canalNorm = normalizarCanal(e.CANAL);
      const clave = `${canalNorm} - ${e.NODO_FALLIDO || 'Error General'}`;
      if (!mapa[clave]) {
        mapa[clave] = {
          nombre: clave,
          canal: canalNorm,
          nodo: e.NODO_FALLIDO || 'Desconocido',
          cantidad: 0,
        };
      }
      mapa[clave].cantidad++;
    });

    return Object.values(mapa)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [erroresFiltrados]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Rango Temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1E3A5F]" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Ventana Temporal del Dashboard:
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'hoy', label: 'Hoy' },
              { id: '7dias', label: 'Últimos 7 días' },
              { id: '30dias', label: 'Últimos 30 días' },
              { id: 'todo', label: 'Todo el Historial' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRangoFecha(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                rangoFecha === item.id
                  ? 'bg-white text-[#1E3A5F] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILA 1: KPIs GENERALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Solicitudes */}
        <div
          onClick={onIrASolicitudes}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#1E3A5F]/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Solicitudes
            </span>
            <div className="p-2 bg-slate-100 rounded-lg text-[#1E3A5F] group-hover:bg-[#1E3A5F] group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {kpis.total}
            </span>
            <span className="text-xs text-slate-500">en rango</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Matrículas procesadas</span>
            <span className="text-[#1E3A5F] font-semibold group-hover:underline">Ver tabla →</span>
          </div>
        </div>

        {/* KPI 2: Total Enviados */}
        <div
          onClick={onIrASolicitudes}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Enviados (SI)
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2E9E5B] tabular-nums">
              {kpis.enviados}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              {kpis.total > 0 ? `${Math.round((kpis.enviados / kpis.total) * 100)}% éxito` : '0%'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Notificados a alumnos</span>
            <span className="text-emerald-700 font-semibold group-hover:underline">Filtrar →</span>
          </div>
        </div>

        {/* KPI 3: Pendientes / Observados */}
        <div
          onClick={onIrASolicitudes}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendientes / Observados
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#E0A100] tabular-nums">
              {kpis.pendientes + kpis.observados}
            </span>
            <span className="text-xs text-slate-500">
              ({kpis.pendientes} pendientes · {kpis.observados} sin vacante)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Requieren atención o cupo</span>
            <span className="text-amber-700 font-semibold group-hover:underline">Revisar →</span>
          </div>
        </div>

        {/* KPI 4: Total Errores */}
        <div
          onClick={onIrAErrores}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Errores de Envío
            </span>
            <div className="p-2 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#D64545] tabular-nums">
              {kpis.totalErrores}
            </span>
            <span className="text-xs text-red-700 font-semibold">
              en n8n / WAHA
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Fallas en nodos de salida</span>
            <span className="text-red-700 font-semibold group-hover:underline">Ver logs →</span>
          </div>
        </div>
      </div>

      {/* FILA 2: KPIS POR CANAL (GMAIL vs WHATSAPP WAHA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI Canal 1: Gmail (Email) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-50 text-[#EA4335]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Canal Gmail (Email)</h3>
                <span className="text-xs text-slate-500">Google Workspace / SMTP n8n</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-red-50 text-[#EA4335] border border-red-200">
              {kpis.email.tasa}% Entrega
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Total Solicitudes</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">{kpis.email.total}</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-700 uppercase tracking-wide block">Enviados (SI)</span>
              <span className="text-lg font-bold text-emerald-600 font-mono tabular-nums">{kpis.email.enviados}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">No Enviados</span>
              <span className="text-lg font-bold text-slate-700 font-mono tabular-nums">{kpis.email.total - kpis.email.enviados}</span>
            </div>
          </div>
        </div>

        {/* KPI Canal 2: WhatsApp (WAHA) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#25D366]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Canal WhatsApp (WAHA)</h3>
                <span className="text-xs text-slate-500">WhatsApp HTTP API / Puppeteer Core</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-[#128C7E] border border-emerald-200">
              {kpis.whatsapp.tasa}% Entrega
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Total Solicitudes</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">{kpis.whatsapp.total}</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-700 uppercase tracking-wide block">Enviados (SI)</span>
              <span className="text-lg font-bold text-emerald-600 font-mono tabular-nums">{kpis.whatsapp.enviados}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">No Enviados</span>
              <span className="text-lg font-bold text-slate-700 font-mono tabular-nums">{kpis.whatsapp.total - kpis.whatsapp.enviados}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 3: GRÁFICOS (BARRAS AGRUPADAS Y DONA DE ESTADOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Barras Agrupadas Solicitudes por Canal */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1E3A5F]" />
                Solicitudes por Canal (Email vs WhatsApp)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de estados procesados por cada canal de notificación
              </p>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosBarrasCanal}
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="canal" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Enviados" fill={COLORES_ESTADO.Enviado} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendientes" fill={COLORES_ESTADO.Pendiente} radius={[4, 4, 0, 0]} />
                <Bar dataKey="No hay vacantes" fill={COLORES_ESTADO.Observado} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Dona de Distribución de Estados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1E3A5F]" />
              Distribución de Estados
            </h3>
            <p className="text-xs text-slate-500">
              Proporción global de notificaciones
            </p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {datosDonaEstados.length === 0 ? (
              <span className="text-xs text-slate-400">Sin datos en el rango seleccionado</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosDonaEstados}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {datosDonaEstados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `${value ?? 0} solicitudes`,
                      'Cantidad',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Texto central en la dona */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 font-mono tabular-nums">{kpis.total}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
            </div>
          </div>

          {/* Leyenda limpia sin pills */}
          <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2E9E5B]" />
                Enviado (SI)
              </span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {kpis.enviados} ({kpis.total > 0 ? Math.round((kpis.enviados / kpis.total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E0A100]" />
                Pendiente
              </span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {kpis.pendientes} ({kpis.total > 0 ? Math.round((kpis.pendientes / kpis.total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D64545]" />
                No hay vacantes
              </span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {kpis.observados} ({kpis.total > 0 ? Math.round((kpis.observados / kpis.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 4: GRÁFICO DE LÍNEAS POR DÍA Y TOP 5 ERRORES HORIZONTALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 3: Líneas de Solicitudes por día (Email vs WhatsApp) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1E3A5F]" />
              Evolución Diaria de Solicitudes por Canal
            </h3>
            <p className="text-xs text-slate-500">
              Volumen de notificaciones cursadas en el tiempo
            </p>
          </div>

          <div className="h-64 w-full">
            {datosLineasDias.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay registros con fecha válida en este rango.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={datosLineasDias}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="Email"
                    stroke={COLOR_EMAIL}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Gmail (Email)"
                  />
                  <Line
                    type="monotone"
                    dataKey="WhatsApp"
                    stroke={COLOR_WHATSAPP}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="WhatsApp (WAHA)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 4: Barras Horizontales Top 5 Errores (Canal y Nodo Fallido) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-[#D64545]" />
                Top 5 Errores por Canal y Nodo Fallido
              </h3>
              <p className="text-xs text-slate-500">
                Permite verificar si falla más WAHA o Gmail en n8n
              </p>
            </div>
            <button
              onClick={onIrAErrores}
              className="text-xs font-semibold text-[#1E3A5F] hover:underline whitespace-nowrap"
            >
              Ver todos →
            </button>
          </div>

          <div className="h-64 w-full">
            {datosTopErrores.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                <span>No se registran errores en el rango temporal seleccionado.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosTopErrores}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={140}
                    tick={{ fontSize: 10, fill: '#334155' }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${value ?? 0} fallos`,
                      'Incidentes',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar
                    dataKey="cantidad"
                    name="Incidentes"
                    radius={[0, 4, 4, 0]}
                  >
                    {datosTopErrores.map((entry, index) => (
                      <Cell
                        key={`cell-err-${index}`}
                        fill={entry.canal === 'WhatsApp' ? COLOR_WHATSAPP : COLOR_EMAIL}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex items-center justify-end gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#25D366]" />
              Fallas WAHA (WhatsApp)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EA4335]" />
              Fallas Gmail (Email)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
