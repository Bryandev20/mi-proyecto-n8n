/**
 * Tipos de datos para el sistema de notificaciones OERAAE
 * Soporta canales Gmail (Email) y WhatsApp (WAHA) procesados en n8n
 */

export interface Solicitud {
  CODALUMNO: string;
  ALUMNO: string;
  ESPECIALIDAD?: string;
  CELULAR: string;
  EMAIL: string;
  "COD CURSO": string;
  SECCURSO: string;
  CODITIPO: string;
  OBSERVACION: string;
  NOTIFICADO: string; // "SI" | "" | "NO HAY VACANTES"
  CANAL_ENVIO: "Email" | "WhatsApp" | string;
  FECHA_ENVIO: string; // e.g. "2026-10-12 22:00:35"
}

export interface LogError {
  FECHA_HORA: string;
  NODO_FALLIDO: string;
  MENSAJE_ERROR: string;
  ALUMNO: string;
  CONTACTO_DESTINO: string;
  CANAL: "WHATSAPP" | "EMAIL" | "WhatsApp" | "Email" | string;
}

export interface ApiResponse {
  solicitudes: Solicitud[];
  log_errores: LogError[];
}

export type EstadoSolicitud = 'Enviado' | 'Pendiente' | 'Observado';

export type FiltroRangoFecha = 'hoy' | '7dias' | '30dias' | 'todo';
export type FiltroCanal = 'Todos' | 'Email' | 'WhatsApp';
export type FiltroEstado = 'Todos' | 'Enviado' | 'Pendiente' | 'No hay vacantes';

export type TabActiva = 'dashboard' | 'solicitudes' | 'errores';
