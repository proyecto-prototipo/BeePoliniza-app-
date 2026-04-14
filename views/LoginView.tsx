import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, UserPlus, Zap, ArrowRight, X, Heart } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

// Sub-componente decorativo: Abejas flotantes tecnificadas
const FloatingBees = () => {
  const bees = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0a0a0a]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFBF00] opacity-10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFBF00] opacity-5 blur-[120px] rounded-full"></div>
      {bees.map((_, i) => (
        <img 
          key={i}
          src="https://cdn-icons-png.flaticon.com/512/517/517563.png" 
          alt="bee"
          className="absolute opacity-20 invert brightness-50 animate-float"
          style={{
            width: `${Math.random() * 30 + 20}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            filter: 'drop-shadow(0 0 10px rgba(255,191,0,0.2))'
          }}
        />
      ))}
    </div>
  );
};

// MODAL DE REGISTRO INTEGRADO
const RegisterModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'AGRICULTOR' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([{
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: 'Activo'
        }])
        .select();

      if (error) throw error;
      alert("✅ ¡Usuario registrado! Ahora puedes iniciar sesión.");
      onClose();
    } catch (err: any) {
      alert("Error al registrar: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">        <button onClick={onClose} className="absolute top-6 right-6 p-1 text-gray-500 hover:text-red-500 transition-colors"><X size={20} /></button>
        <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
            <UserPlus className="text-[#FFBF00]" /> Alta de Usuario
        </h3>
        <p className="text-gray-500 text-sm mb-8 font-medium">Únete al ecosistema BeePoliniza Pro-AI.</p>
        <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" required placeholder="Nombre Completo" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="password" required placeholder="Contraseña" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => setFormData({...formData, role: 'AGRICULTOR'})} className={`py-3 rounded-xl font-bold text-xs border-2 transition-all ${formData.role === 'AGRICULTOR' ? 'border-[#FFBF00] bg-[#FFBF00]/10 text-[#FFBF00]' : 'border-white/5 text-gray-500 hover:border-white/10'}`}>AGRICULTOR</button>
              <button type="button" onClick={() => setFormData({...formData, role: 'APICULTOR'})} className={`py-3 rounded-xl font-bold text-xs border-2 transition-all ${formData.role === 'APICULTOR' ? 'border-[#FFBF00] bg-[#FFBF00]/10 text-[#FFBF00]' : 'border-white/5 text-gray-500 hover:border-white/10'}`}>APICULTOR</button>
            </div>
            <button type="submit" className="w-full bg-[#FFBF00] text-[#1A1A1A] py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-4">Confirmar Registro</button>
        </form>
      </div>
    </div>
  );
};

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).eq('password', password).single();
      if (error || !data) throw new Error("Credenciales incorrectas.");
      onLoginSuccess(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans overflow-hidden">
      <FloatingBees />
      
      <div className="relative w-full max-w-[1100px] flex flex-col md:flex-row bg-white/10 md:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-y-auto md:overflow-hidden z-10 animate-in zoom-in-95 duration-1000 max-h-[95vh] md:max-h-none">
        
        {/* LADO IZQUIERDO: LOGIN */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 flex items-center gap-4">
             <div className="bg-gradient-to-br from-[#FFBF00] to-[#E6AC00] p-4 rounded-[1.5rem] text-[#1a1a1a] shadow-[0_0_25px_rgba(255,191,0,0.3)]">
                <Zap size={28} fill="currentColor" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tighter">Bee<span className="text-[#FFBF00]">Poliniza</span></h1>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Bienvenid@ de nuevo🐝</h2>
          <p className="text-gray-400 text-sm font-medium mb-6 md:mb-10">Inicia sesión en la torre de control.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" required placeholder="Correo electrónico" className="w-full bg-white/5 border border-white/10 p-4 md:p-5 text-sm md:text-base rounded-2xl text-white outline-none focus:border-[#FFBF00]/50 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required placeholder="Contraseña" className="w-full bg-white/5 border border-white/10 p-4 md:p-5 text-sm md:text-base rounded-2xl text-white outline-none focus:border-[#FFBF00]/50 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={isLoading} className="w-full bg-[#FFBF00] text-[#1A1A1A] py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
              {isLoading ? 'Autenticando...' : 'Entrar al Ecosistema'}
            </button>
          </form>

          {/* BOTÓN DE REGISTRO MEJORADO */}
          <div className="mt-12 pt-8 border-t border-white/5">
             <div className="bg-white/5 p-6 rounded-3xl flex items-center justify-between border border-white/5 hover:border-[#FFBF00]/30 transition-all group">
                <div>
                   <p className="text-white font-bold text-sm">¿No tienes cuenta?</p>
                   <p className="text-gray-500 text-xs">Únete como agricultor o apicultor</p>
                </div>
                <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="bg-white/10 hover:bg-[#FFBF00] text-white hover:text-[#1A1A1A] p-3 rounded-2xl transition-all"
                >
                   <UserPlus size={20} />
                </button>
             </div>
          </div>
        </div>

        {/* LADO DERECHO: INFO */}
        <div className="hidden md:flex w-1/2 bg-[#0a0a0a] relative p-12 lg:p-20 flex flex-col justify-center text-white border-l border-white/10 overflow-hidden min-h-[500px]">
          {/* Fondo con efecto de profundidad mejorado */}
          <div className="absolute inset-0 hexagon-pattern opacity-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FFBF00] opacity-[0.03] blur-[100px] rounded-full"></div>
          
          {/* Badge Superior - Ahora posicionado absolutamente arriba para dejar aire */}
          <div className="absolute top-12 left-12 lg:left-20 z-10">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 pr-6 rounded-full flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Sistemas IoT Online</span>
            </div>
          </div>

          {/* Contenido Principal - Centrado con justify-center en el padre */}
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <h3 className="text-4xl lg:text-6xl font-black leading-[1.1] text-white tracking-tighter">
                "Tu Inversión,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] to-[#E6AC00]">
                  Monitoreada
                </span><br />
                Segundo a Segundo"
              </h3>
              {/* Línea decorativa pro */}
              <div className="h-1.5 w-24 bg-[#FFBF00] rounded-full shadow-[0_0_15px_rgba(255,191,0,0.4)]"></div>
            </div>
            
            <p className="text-gray-400 text-xl leading-relaxed max-w-md">
              Con BeeTrack Live, tienes 
              <span className="text-white font-bold ml-1 border-b-2 border-[#FFBF00]/30 pb-0.5">
                telemetría biológica y GPS en tiempo real
              </span> 
            </p>

            {/* Pequeño detalle visual de carga/estado para que no se vea vacío */}
            <div className="pt-4 flex gap-4 opacity-50">
              <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <span className="text-[8px] uppercase tracking-widest font-bold">Datos Encriptados</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <span className="text-[8px] uppercase tracking-widest font-bold">Reportes en Tiempo Real</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
};

export default LoginView;