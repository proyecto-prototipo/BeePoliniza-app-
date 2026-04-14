import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import Navbar from './components/Navbar';
import FarmerView from './views/FarmerView';
import BeekeeperView from './views/BeekeeperView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView'; // Asegúrate de haber creado este archivo

const App: React.FC = () => {
  // --- ESTADOS ORIGINALES ---
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [activeTab, setActiveTab] = useState('inicio');

  // --- NUEVOS ESTADOS PARA LOGIN (SIN ALTERAR LOS ANTERIORES) ---
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Efecto original para resetear tab cuando cambia el rol
  useEffect(() => {
    setActiveTab('inicio');
  }, [role]);

  // Efecto para recuperar sesión al cargar la página
  useEffect(() => {
    const savedUser = localStorage.getItem('beeUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setRole(user.role as UserRole);
    }
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN ---
  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    const normalizedRole = userData.role as UserRole;
    setRole(normalizedRole);
    localStorage.setItem('beeUser', JSON.stringify(userData));
    
    // Redirección inicial según rol
    if (userData.role === UserRole.ADMIN) setActiveTab('inicio');
    else setActiveTab('inicio');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('beeUser');
    setActiveTab('inicio');
  };

  const renderContent = () => {
    if (!currentUser) {
      return <LoginView onLoginSuccess={handleLoginSuccess} />;
    }

    // Switch original para renderizar según el rol
    switch (role) {
      case UserRole.FARMER:
        // Añadimos currentUser aquí
        return <FarmerView activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />;
      
      case UserRole.BEEKEEPER:
        // Añadimos currentUser aquí
        return <BeekeeperView activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />;
      
      case UserRole.ADMIN:
        return <AdminView activeTab={activeTab} setActiveTab={setActiveTab} />;
      
      default:
        return <div>Error de Rol</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* El Navbar solo se muestra si hay un usuario logueado */}
      {currentUser && (
        <Navbar 
          role={role} 
          setRole={setRole} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          // Pasamos el logout si tu Navbar lo requiere, o para uso futuro
          onLogout={handleLogout}
          userRole={currentUser.role}
        />
      )}

      <main className={`flex-grow ${currentUser ? 'pt-20 pb-12' : ''}`}>
        {renderContent()}
      </main>

      {/* Footer original */}
      <footer className="bg-[#1A1A1A] text-white py-8 border-t-4 border-[#FFBF00]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm opacity-60">© 2026 BeePoliniza Pro-AI. Innovando por la biodiversidad y la agricultura sostenible.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;