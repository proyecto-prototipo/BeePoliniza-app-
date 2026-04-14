import React, { useState } from 'react'; // <--- CAMBIO 1: Añadimos useState
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Map, 
  FileText, 
   BarChart3, 
  HelpCircle, 
  Settings, 
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu, // <--- CAMBIO 2: Añadimos Menu
  X 
} from 'lucide-react';

interface NavbarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userRole: string; 
}

const Navbar: React.FC<NavbarProps> = ({ role, setRole, activeTab, setActiveTab, onLogout, userRole }) => {
  const [isOpen, setIsOpen] = useState(false); // <--- CAMBIO 3: Estado para el menú móvil

  const navItems = {
    [UserRole.FARMER]: [
      { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
      { id: 'market', label: 'Marketplace', icon: ShoppingBag },
      { id: 'beetrack', label: 'BeeTrack IoT', icon: Map },
      { id: 'contracts', label: 'Contratos', icon: FileText },
      { id: 'metrics', label: 'Métricas', icon: BarChart3 },
      { id: 'help', label: 'Ayuda', icon: HelpCircle },
    ],
    [UserRole.BEEKEEPER]: [
      { id: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my_offers', label: 'Mis Ofertas', icon: ShoppingBag },
      { id: 'market', label: 'Negociaciones', icon: ShoppingBag },
      { id: 'beetrack', label: 'Apiarios', icon: Map },
      { id: 'contracts', label: 'Gestión', icon: FileText },
      { id: 'metrics', label: 'Rendimiento', icon: BarChart3 },
    ],
    [UserRole.ADMIN]: [
      { id: 'inicio', label: 'Control Global', icon: ShieldCheck },
      { id: 'moderation', label: 'Moderación', icon: Settings },
      { id: 'users', label: 'Usuarios', icon: FileText },
      { id: 'impact', label: 'Reporte Ambiental', icon: BarChart3 },
    ]
  };

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Lado Izquierdo: Logo y Botón Menú Móvil */}
        <div className="flex items-center gap-4">
          {/* BOTÓN HAMBURGUESA: Solo se ve en celulares (md:hidden) */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('inicio')}>
            <div className="w-10 h-10 bg-[#FFBF00] rounded-xl flex items-center justify-center text-[#1A1A1A] shadow-lg shadow-yellow-200">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4.5 6.33V15L12 19.33L19.5 15V6.33L12 2ZM17.5 13.84L12 17.03L6.5 13.84V7.83L12 4.64L17.5 7.83V13.84Z"/>
                  <path d="M12 8L10 9.15V11.46L12 12.61L14 11.46V9.15L12 8Z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl text-[#1A1A1A] leading-none">BeePoliniza</h1>
              <span className="text-[10px] font-bold tracking-widest text-[#FFBF00] uppercase">Pro-AI Ecosystem</span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation (DESKTOP) */}
        <div className="hidden md:flex items-center gap-1">
          {navItems[role]?.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-[#FFBF00] text-[#1A1A1A] font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sección Derecha */}
        <div className="flex items-center gap-3">
          {userRole === 'ADMIN' ? (
            <div className="relative hidden sm:flex items-center"> {/* Oculto en móviles muy pequeños */}
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="appearance-none bg-gray-100 border-2 border-[#FFBF00] rounded-full px-5 py-2 pr-10 text-xs font-bold text-[#1A1A1A] outline-none hover:bg-gray-200 transition-all cursor-pointer"
              >
                <option value={UserRole.FARMER}>Rol: Agricultor</option>
                <option value={UserRole.BEEKEEPER}>Rol: Apicultor</option>
                <option value={UserRole.ADMIN}>Rol: Admin</option>
              </select>
              <ChevronDown className="absolute right-3 text-gray-500 pointer-events-none" size={14} />
            </div>
          ) : (
            <div className="hidden sm:block bg-gray-50 border border-gray-100 px-4 py-2 rounded-full">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Rol: {userRole === 'AGRICULTOR' ? 'Agricultor' : 'Apicultor'}
              </span>
            </div>
          )}

          <button 
            onClick={onLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            title="Cerrar Sesión"
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden hidden xs:block">
            <img src={`https://picsum.photos/seed/${role}/100/100`} alt="Avatar" />
          </div>
        </div>
      </div>

      {/* --- MENU MÓVIL DESPLEGABLE --- */}
      {/* Solo se muestra si isOpen es true y estamos en móvil */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-300">
          {navItems[role]?.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false); // Cerrar menú al hacer click
              }}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                activeTab === item.id 
                  ? 'bg-yellow-50 text-[#FFBF00] font-bold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
          
          {/* Si es Admin, mostrar el selector de rol dentro del menú móvil también */}
          {userRole === 'ADMIN' && (
            <div className="pt-4 border-t mt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-4">Cambiar Vista de Rol</p>
                <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => {setRole(UserRole.FARMER); setIsOpen(false);}} className={`text-left px-4 py-2 rounded-lg text-xs font-bold ${role === UserRole.FARMER ? 'bg-[#FFBF00]' : 'bg-gray-50'}`}>Vista Agricultor</button>
                    <button onClick={() => {setRole(UserRole.BEEKEEPER); setIsOpen(false);}} className={`text-left px-4 py-2 rounded-lg text-xs font-bold ${role === UserRole.BEEKEEPER ? 'bg-[#FFBF00]' : 'bg-gray-50'}`}>Vista Apicultor</button>
                    <button onClick={() => {setRole(UserRole.ADMIN); setIsOpen(false);}} className={`text-left px-4 py-2 rounded-lg text-xs font-bold ${role === UserRole.ADMIN ? 'bg-[#FFBF00]' : 'bg-gray-50'}`}>Vista Admin</button>
                </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;