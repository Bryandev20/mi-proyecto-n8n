import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginProps {
  onDemoLogin?: (email: string) => void;
}

/**
 * Pantalla institucional de inicio de sesión para trabajadores OERAAE.
 * Utiliza Supabase Auth (Email y Contraseña) y bloquea el acceso al dashboard si no hay sesión.
 */
export const Login: React.FC<LoginProps> = ({ onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const correoLimpio = email.trim();
    if (!correoLimpio || !password) {
      setErrorMsg('Por favor, ingresa tu correo institucional y contraseña.');
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      setErrorMsg(
        'Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas en el entorno. Configúralas o usa el acceso de demostración.'
      );
      return;
    }

    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: correoLimpio,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Tu cuenta aún no ha sido confirmada por correo electrónico.');
        } else {
          setErrorMsg(`Error de autenticación: ${error.message}`);
        }
      }
      // Si el login es exitoso, onAuthStateChange en App.tsx actualizará la sesión automáticamente
    } catch (err) {
      console.error('Error inesperado al iniciar sesión:', err);
      setErrorMsg('No se pudo conectar con el servidor de autenticación. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Cabecera Institucional */}
        <div className="bg-[#1E3A5F] px-6 py-7 text-white text-center border-b border-[#162C48]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-xl tracking-wider shadow-inner">
            OE
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Panel de Solicitudes OERAAE
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Acceso exclusivo para personal autorizado · Notificaciones n8n
          </p>
        </div>

        {/* Formulario de Inicio de Sesión */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#1E3A5F] shrink-0" />
            <span>Inicia sesión con tu cuenta institucional registrada en Supabase.</span>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trabajador@uni.edu.pe"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162C48] active:scale-[0.99] disabled:opacity-60 transition-all shadow-sm cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E3A5F]"
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Opción de acceso de demostración si Supabase no está configurado en el entorno local */}
          {!isSupabaseConfigured && onDemoLogin && (
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Supabase aún no está configurado en <code className="font-mono bg-slate-100 px-1 py-0.5 rounded-sm">.env</code>. Puedes explorar el panel con una sesión de demostración:
              </p>
              <button
                type="button"
                onClick={() => onDemoLogin(email.trim() || 'operador.demo@oeraae.edu.pe')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Ingresar con Sesión Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center">
        OERAAE · Sistema Integrado de Monitoreo Multicanal (Gmail & WhatsApp WAHA)
      </p>
    </div>
  );
};
