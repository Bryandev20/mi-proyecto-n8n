import { Solicitud, LogError, EstadoSolicitud } from '../types';

/**
 * Determina el estado visual de una solicitud:
 * - "SI" en NOTIFICADO -> 'Enviado' (Verde)
 * - "NO HAY VACANTES" en NOTIFICADO u OBSERVACION -> 'Observado' (Rojo)
 * - Vacío o cualquier otro -> 'Pendiente' (Ámbar)
 */
export function getEstado(solicitud: Solicitud): EstadoSolicitud {
  const notificado = (solicitud.NOTIFICADO || '').trim().toUpperCase();
  const observacion = (solicitud.OBSERVACION || '').trim().toUpperCase();

  if (notificado === 'SI') {
    return 'Enviado';
  }
  if (notificado.includes('NO HAY VACANTES') || observacion.includes('NO HAY VACANTES')) {
    return 'Observado';
  }
  return 'Pendiente';
}

/**
 * Normaliza el nombre del canal a 'Email' o 'WhatsApp'
 */
export function normalizarCanal(canalStr: string = ''): 'Email' | 'WhatsApp' {
  const lower = canalStr.trim().toLowerCase();
  if (lower.includes('what') || lower.includes('waha')) {
    return 'WhatsApp';
  }
  return 'Email';
}

/**
 * Parsea una fecha en string a Date de forma segura
 */
export function parseFecha(fechaStr?: string): Date | null {
  if (!fechaStr || !fechaStr.trim()) return null;
  const d = new Date(fechaStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Comprueba si una fecha está dentro del rango especificado
 */
export function estaEnRango(fechaStr: string | undefined, rango: 'hoy' | '7dias' | '30dias' | 'todo'): boolean {
  if (rango === 'todo') return true;
  const fecha = parseFecha(fechaStr);
  if (!fecha) return false;

  const ahora = new Date();
  const medianocheHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  if (rango === 'hoy') {
    return fecha >= medianocheHoy;
  }
  if (rango === '7dias') {
    const hace7Dias = new Date(medianocheHoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return fecha >= hace7Dias;
  }
  if (rango === '30dias') {
    const hace30Dias = new Date(medianocheHoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return fecha >= hace30Dias;
  }
  return true;
}

/**
 * Exporta un array de objetos a un archivo CSV descargable con codificación UTF-8
 */
export function descargarCSV(nombreArchivo: string, datos: Array<Record<string, unknown>>) {
  if (!datos || datos.length === 0) {
    alert('No hay datos disponibles para exportar con los filtros actuales.');
    return;
  }

  const cabeceras = Object.keys(datos[0]);
  const filas = datos.map((fila) =>
    cabeceras
      .map((campo) => {
        const valor = fila[campo] !== undefined && fila[campo] !== null ? String(fila[campo]) : '';
        // Escapar comillas dobles y encerrar entre comillas
        const escapado = valor.replace(/"/g, '""');
        return `"${escapado}"`;
      })
      .join(',')
  );

  const contenidoCsv = [cabeceras.map((c) => `"${c}"`).join(','), ...filas].join('\r\n');
  const blob = new Blob(['\uFEFF' + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.setAttribute('href', url);
  enlace.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
