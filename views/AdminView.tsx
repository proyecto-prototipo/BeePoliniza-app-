import { supabase } from '../supabaseClient';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Download, 
  Check, 
  X, 
  FileBadge, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Eye, 
  ShieldCheck, 
  UserPlus,
  TreePine,
  Edit,
  Trash2,
  Wind,
  Droplets,
  CheckCircle,
  Clock,
  Mail,
  User as UserIcon,

  Zap,
  MapPin,
  Activity
} from 'lucide-react';
import { OFFERS } from '../constants';
import SignatureCanvas from 'react-signature-canvas';
const getRoleStyle = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'APICULTOR':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'AGRICULTOR':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const AdminView: React.FC<{ activeTab: string, setActiveTab: (t: string) => void }> = ({ activeTab, setActiveTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'TODOS' | 'AGRICULTOR' | 'APICULTOR'>('TODOS');
  
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [totalComisiones, setTotalComisiones] = useState<number>(0);


 const [realContracts, setRealContracts] = useState([]);
 const [solicitudes, setSolicitudes] = useState([]);
 const [loading, setLoading] = useState(true);

 const sigCanvasAdmin = useRef<any>(null); // Referencia para el trazo
const [adminSignature, setAdminSignature] = useState<string | null>(null); // Guarda la imagen de la firma

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'Pendiente' | 'Aprobada' | 'Rechazada'>('Pendiente');

  // Estado para la lista de usuarios (empezando con los mocks previos)
  // 1. Ahora la lista empieza vacía ([]) porque los datos vendrán de la nube
    const [usersList, setUsersList] = useState<any[]>([]);

    // 2. Este es el bloque que se encarga de ir a buscar los datos reales
    useEffect(() => {
  const cargarUsuarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error("Error al traer datos:", error.message);
    else if (data) setUsersList(data);
  };

  cargarUsuarios();

  // --- LÓGICA TIEMPO REAL: Usuarios ---
  const userChannel = supabase
    .channel('db-usuarios-admin')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'usuarios' }, 
      () => {
        cargarUsuarios(); // Recarga la lista automáticamente si hay cambios
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(userChannel);
  };
}, []);

    

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'AGRICULTOR'
    });

    const [editingUser, setEditingUser] = useState<any>(null);

    const [offersList, setOffersList] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

   useEffect(() => {
  const fetchOffers = async () => {
    setLoadingOffers(true);
    // 1. Jalamos las ofertas filtrando por el estado del botón (Pendiente, Aprobada, Rechazada)
    const { data, error } = await supabase
      .from('ofertas')
      .select('*')
      .eq('status', filterStatus) 
      .order('id', { ascending: false });

    if (error) {
      console.error("Error al cargar moderación:", error.message);
    } else {
      setOffersList(data || []);
    }
    setLoadingOffers(false);
  };

  fetchOffers();

  // 2. SUSCRIPCIÓN EN TIEMPO REAL (Para que aparezcan apenas el apicultor publique)
  const channel = supabase
    .channel('cambios-moderacion')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'ofertas' }, 
      () => fetchOffers() // Recarga la lista automáticamente
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [filterStatus]);

const updateOfferStatus = async (offer: any, newStatus: 'Aprobada' | 'Rechazada' | 'Pendiente') => {
  if (!offer || !offer.id) return;

  // 1. Actualizar el estado en la tabla 'ofertas'
  const { error: updateError } = await supabase
    .from('ofertas')
    .update({ status: newStatus })
    .eq('id', offer.id);

  if (updateError) {
    return alert("Error al actualizar: " + updateError.message);
  }

  // 2. Si la estamos pasando a Aprobada, creamos el contrato
  if (newStatus === 'Aprobada') {
    const { error: contractError } = await supabase
      .from('contratos')
      .insert([{
        partner: offer.provider,
        total: offer.price,
        status: 'Firmado',
        date: new Date().toISOString()
      }]);
    
    if (contractError) console.error("Error al crear contrato:", contractError.message);
  }

  // 3. Actualizar la interfaz: quitamos la oferta de la lista actual
  setOffersList(prev => prev.filter(o => o.id !== offer.id));
  alert(`Oferta movida a ${newStatus} con éxito.`);
};


const handleApproveOffer = async (offer: any) => {
  if (!offer || !offer.id) return;

  // 1. Calculamos la comisión del 10% aquí mismo
  const comisionCalculada = Number(offer.price) * 0.10;

  const { error: updateError } = await supabase
    .from('ofertas')
    .update({ status: 'Aprobada' })
    .eq('id', offer.id);

  if (updateError) return alert("Error: " + updateError.message);

  // 2. CREAMOS EL CONTRATO CON LA COMISIÓN
  const { error: contractError } = await supabase
    .from('contratos')
    .insert([{
      partner: offer.provider,
      total: offer.price,
      comision: comisionCalculada, // <--- ESTO ES LO QUE FALTABA
      status: 'Firmado', 
      date: new Date().toISOString()
    }]);

  if (contractError) console.error("Error al crear contrato:", contractError.message);

  setOffersList(prev => prev.filter(o => o.id !== offer.id));
  alert("Oferta aprobada. Se ha generado la comisión de S/ " + comisionCalculada);
};



// Cálculos dinámicos para las Cards superiores
const totalUsuariosReales = usersList.length;
const agriculoresCount = usersList.filter(u => u.role === 'AGRICULTOR').length;
const apicultoresCount = usersList.filter(u => u.role === 'APICULTOR').length;

// Estado y carga para el Volumen Transado
useEffect(() => {
    const fetchContracts = async () => {
        try {
            const { data, error } = await supabase
                .from('contratos')
                .select('total, comision, status');

            if (error) throw error;

            if (data) {
                // ESTA LÍNEA ES LA CLAVE:
                console.log("Datos recibidos de Supabase:", data);
                
                setContractsList(data);
                
                const suma = data
                    .filter(c => c.status === 'Firmado' || c.status === 'Pagado' || c.status === 'Aceptado')
                    .reduce((acc, curr) => acc + (Number(curr.comision) || 0), 0);
                
                console.log("Resultado de la suma calculada:", suma);
                setTotalComisiones(suma);
            }
        } catch (err) {
            console.error("Error en Torre de Control:", err);
        }
    };
    fetchContracts();
}, []);

// NUEVO: Carga de datos globales para el Reporte de Impacto y métricas de Admin
useEffect(() => {
    const cargarDatosImpacto = async () => {
        setLoading(true);
        try {
            const [contratosRes, solicitudesRes] = await Promise.all([
                supabase.from('contratos').select('*'),
                supabase.from('solicitudes').select('*')
            ]);

            if (contratosRes.data) setRealContracts(contratosRes.data);
            if (solicitudesRes.data) setSolicitudes(solicitudesRes.data);
            
        } catch (error) {
            console.error("Error cargando datos de impacto:", error);
        } finally {
            setLoading(false);
        }
    };

    cargarDatosImpacto();
}, []); // Se ejecuta una sola vez al cargar el Admin

// Sumamos todos los totales de la tabla contratos
const volumenTransado = contractsList
  .filter(c => c.status === 'Firmado' || c.status === 'Pagado') // Solo suma contratos válidos
  .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);


const handleRejectOffer = async (offerId: number) => {
  const { error } = await supabase
    .from('ofertas')
    .update({ status: 'Rechazada' })
    .eq('id', offerId);

  if (error) alert("Error al rechazar: " + error.message);
  else setOffersList(offersList.filter(o => o.id !== offerId));
};
    
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [newOffer, setNewOffer] = useState({
        provider: '',
        cropType: '',
        hiveCount: 0,
        efficiencyScore: 0,
        price: 0
    });

    const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Verificado', // El admin valida al registrar
        Fecha_registro: new Date().toLocaleDateString()
    };

    try {
        if (editingUser) {
            // CASO 1: EDITAR USUARIO EXISTENTE
            const { error } = await supabase
                .from('usuarios')
                .update({ name: newUser.name, email: newUser.email, role: newUser.role })
                .eq('id', editingUser.id);

            if (error) throw error;
            
            setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
            alert("✅ Usuario actualizado correctamente");
        } else {
            // CASO 2: REGISTRAR NUEVO USUARIO
            const { data, error } = await supabase
                .from('usuarios')
                .insert([userData])
                .select();

            if (error) throw error;

            if (data) setUsersList([data[0], ...usersList]);
            alert("✅ Usuario guardado en la base de datos");
        }

        // Limpiar estados y cerrar modal
        setIsRegisterModalOpen(false);
        setEditingUser(null);
        setNewUser({ name: '', email: '', role: 'AGRICULTOR' });

    } catch (err: any) {
        alert("Error en la operación: " + err.message);
    }
};

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setNewUser({ name: user.name, email: user.email, role: user.role });
        setIsRegisterModalOpen(true);
    };

    const handleDeleteUser = (id: string) => {
        setUsersList(usersList.filter(u => u.id !== id));
    };

    const openNewUserModal = () => {
        setEditingUser(null);
        setNewUser({ name: '', email: '', role: 'AGRICULTOR' });
        setIsRegisterModalOpen(true);
    };

    const handleEditOffer = (offer: any) => {
        setEditingOffer(offer);
        setNewOffer({
        provider: offer.provider,
        cropType: offer.cropType,
        hiveCount: offer.hiveCount,
        efficiencyScore: offer.efficiencyScore,
        price: offer.price
        });
        setIsOfferModalOpen(true);
    };

    const handleDeleteOffer = (id: string) => {
        setOffersList(offersList.filter(o => o.id !== id));
    };

    const handleSaveOffer = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingOffer) {
        setOffersList(offersList.map(o => o.id === editingOffer.id ? { ...o, ...newOffer } : o));
        } else {
        setOffersList([{ ...newOffer, id: `O${Date.now()}`, region: 'N/A' }, ...offersList]);
        }
        setIsOfferModalOpen(false);
    };

    const offerModal = isOfferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-[#1A1A1A] p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-full hexagon-pattern opacity-10"></div>
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Shield className="text-[#FFBF00]" /> {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
                    </h3>
                </div>
                <form className="p-8 space-y-6" onSubmit={handleSaveOffer}>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase">Proveedor</label>
                        <input required type="text" value={newOffer.provider} onChange={e => setNewOffer({...newOffer, provider: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Cultivo</label>
                            <input required type="text" value={newOffer.cropType} onChange={e => setNewOffer({...newOffer, cropType: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00]" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Colmenas</label>
                            <input required type="number" value={newOffer.hiveCount} onChange={e => setNewOffer({...newOffer, hiveCount: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00]" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Eficiencia (%)</label>
                            <input required type="number" value={newOffer.efficiencyScore} onChange={e => setNewOffer({...newOffer, efficiencyScore: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00]" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Precio ($)</label>
                            <input required type="number" value={newOffer.price} onChange={e => setNewOffer({...newOffer, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00]" />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => setIsOfferModalOpen(false)} className="flex-1 border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 bg-[#FFBF00] text-[#1A1A1A] py-4 rounded-2xl font-bold shadow-lg shadow-yellow-200 transition-all hover:scale-105">{editingOffer ? 'Guardar Cambios' : 'Crear Oferta'}</button>
                    </div>
                </form>
            </div>
        </div>
    );


    //////////////////////// CONTROL GLOBAL /////////////////////////////////////////////////

    if (activeTab === 'inicio') {
    return (
        <div className="max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
            <div className="mb-12">
                <h2 className="text-4xl font-bold">Torre de Control</h2>
                <p className="text-gray-500">Supervisión global de transacciones y salud del ecosistema BeePoliniza.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hectáreas Totales</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2">
                        {solicitudes.reduce((acc, curr) => acc + (Number(curr.hectareas) || 0), 0).toLocaleString()}
                    </p>
                    <span className="text-xs text-green-500 font-bold">Ecosistema en expansión</span>
                </div>
                
                {/* CARD USUARIOS: Ahora usa datos reales */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuarios Activos</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2">{totalUsuariosReales}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 rounded bg-blue-50">{agriculoresCount} Agric.</span>
                        <span className="text-[10px] font-bold text-[#FFBF00] px-2 py-0.5 rounded bg-yellow-50">{apicultoresCount} Apic.</span>
                    </div>
                </div>

                {/* CARD VOLUMEN: Ahora suma los totales de contratos */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volumen Transado</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2 tracking-tight">
                        S/ {volumenTransado >= 1000 ? `${(volumenTransado/1000).toFixed(1)}k` : volumenTransado.toLocaleString()}
                    </p>
                    <span className="text-xs text-gray-400">Total acumulado</span>
                </div>

                <div className="bg-[#1A1A1A] p-8 rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 hexagon-pattern opacity-20 transform translate-x-8 -translate-y-8"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilidad BeePoliniza (10%)</span>
                    {/* Aquí usamos la variable que ya no te dará error */}
                    <p className="text-4xl font-bold text-[#FFBF00] mt-2">
                        S/ {totalComisiones.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} className="text-green-500" /> Comisión por intermediación
                    </span>
                </div>
            </div>

            {/* TABLA MODERACIÓN: Ahora usa las ofertas reales de Supabase */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-xl">Moderación de Ofertas Recientes</h4>
                    <button onClick={() => setActiveTab('moderation')} className="text-[#FFBF00] font-bold text-sm hover:underline flex items-center gap-2">
                        Ver todas <ExternalLink size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-4">Apicultor</th>
                            <th className="px-8 py-4">Servicio / Cultivo</th>
                            <th className="px-8 py-4">Eficiencia IA</th>
                            <th className="px-8 py-4">Estado</th>
                            <th className="px-8 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {/* Mostramos las 3 más recientes que estén en estado Pendiente */}
                        {offersList.filter(o => o.status === 'Pendiente').slice(0, 3).map(offer => (
                            <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 font-bold">{offer.provider}</td>
                                <td className="px-8 py-6 text-sm text-gray-500">{offer.hive_count} Colmenas / {offer.crop_type}</td>
                                <td className="px-8 py-6">
                                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {offer.efficiency}%
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="flex items-center gap-2 text-xs font-bold text-yellow-600">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div> Pendiente
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right space-x-2">
                                    {/* Usamos las funciones que ya creamos para que funcionen aquí también */}
                                    <button 
                                        onClick={() => handleApproveOffer(offer)} // Función que ya tienes en la línea 125
                                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleRejectOffer(offer.id)} // Función que ya tienes en la línea 170
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {offersList.filter(o => o.status === 'Pendiente').length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">No hay tareas de moderación pendientes.</div>
                )}
            </div>
        </div>
    );
}


    //////////////////////// MODERACIÓN  /////////////////////////////////////////////////

    if (activeTab === 'moderation') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-bold mb-2">Curación de Servicios</h2>
                        <p className="text-gray-500">Aprobar o rechazar ofertas según estándares de calidad biológica.</p>
                    </div>
                    <div className="flex bg-white p-1 md:p-2 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setFilterStatus('Pendiente')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'Pendiente' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Pendientes ({filterStatus === 'Pendiente' ? offersList.length : '...'})
                        </button>
                        <button 
                            onClick={() => setFilterStatus('Aprobada')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'Aprobada' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Aprobadas
                        </button>
                        <button 
                            onClick={() => setFilterStatus('Rechazada')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'Rechazada' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Rechazadas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {offersList.map((offer) => (
                        <div key={offer.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
                            <div className="flex items-center gap-6 flex-1">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <Shield className="text-[#FFBF00]" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{offer.provider}</h4>
                                <p className="text-xs text-gray-400">
                                Publicado: {new Date(offer.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-[2]">
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cultivo</span>
                                <span className="font-bold text-sm">{offer.crop_type}</span> {/* Nota el guion bajo */}
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cantidad</span>
                                <span className="font-bold text-sm">{offer.hive_count} Colmenas</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Eficiencia</span>
                                <span className="font-bold text-sm text-green-600">{offer.efficiency}%</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Precio Sugerido</span>
                                <span className="font-bold text-sm">S/. {offer.price}</span>
                            </div>
                            </div>

                            <div className="flex gap-2">
                            {/* BOTÓN APROBAR: Aparece si la oferta está Pendiente o si está Rechazada */}
                            {filterStatus !== 'Aprobada' && (
                                <button 
                                onClick={() => handleApproveOffer(offer)}
                                className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-sm hover:bg-green-200 transition-all flex items-center gap-2"
                                >
                                <Check size={16} /> {filterStatus === 'Rechazada' ? 'Corregir y Aprobar' : 'Aprobar'}
                                </button>
                            )}

                            {/* BOTÓN RECHAZAR: Solo aparece si está Pendiente */}
                            {filterStatus === 'Pendiente' && (
                                <button 
                                onClick={() => handleRejectOffer(offer.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                >
                                <X size={20} />
                                </button>
                            )}

                            {/* BOTÓN REVISAR: Si ya está aprobada o rechazada, permite devolverla a pendiente */}
                            {filterStatus !== 'Pendiente' && (
                                <button 
                                onClick={async () => {
                                    await supabase.from('ofertas').update({ status: 'Pendiente' }).eq('id', offer.id);
                                    setOffersList(prev => prev.filter(o => o.id !== offer.id));
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                >
                                Revertir a Pendiente
                                </button>
                            )}

                            <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                                <Eye size={20} />
                            </button>
                            </div>
                        </div>
                        ))}

                        {/* Si la lista está vacía mostramos un mensaje */}
                        {offersList.length === 0 && !loadingOffers && (
                        <p className="text-center text-gray-400 py-10">No hay ofertas pendientes de moderación.</p>
                        )}
                </div>
            </div>
        );
    }


        //////////////////////// USUARIOS /////////////////////////////////////////////////


    if (activeTab === 'users') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl font-bold">Directorio CRM</h2>
                        <p className="text-gray-500">Gestión centralizada de todos los actores del ecosistema.</p>
                    </div>
                    <button 
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
                    >
                        <UserPlus size={20} className="text-[#FFBF00]" /> Registrar Usuario Manual
                    </button>
                </div>

                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre o email..." 
                                className="w-full bg-gray-50 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#FFBF00]/20"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <button onClick={() => setUserTypeFilter('TODOS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userTypeFilter === 'TODOS' ? 'bg-[#FFBF00] text-[#1A1A1A]' : 'bg-gray-50 text-gray-500'}`}>TODOS</button>
                            <button onClick={() => setUserTypeFilter('AGRICULTOR')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userTypeFilter === 'AGRICULTOR' ? 'bg-[#FFBF00] text-[#1A1A1A]' : 'bg-gray-50 text-gray-500'}`}>AGRICULTORES</button>
                            <button onClick={() => setUserTypeFilter('APICULTOR')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userTypeFilter === 'APICULTOR' ? 'bg-[#FFBF00] text-[#1A1A1A]' : 'bg-gray-50 text-gray-500'}`}>APICULTORES</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto"> {/* Este es el contenedor del scroll */}
                    <table className="w-full text-left min-w-[800px]"> {/* min-w asegura que la info no se aplaste */}
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Usuario</th>
                                <th className="px-8 py-5">Rol</th>
                                <th className="px-8 py-5">Registro</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {usersList
                            .filter(u => userTypeFilter === 'TODOS' || u.role === userTypeFilter)
                            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#1A1A1A] font-bold border border-gray-200">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1A1A1A]">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* CAMBIO REALIZADO: SE APLICA getRoleStyle PARA COLORES DINÁMICOS */}
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getRoleStyle(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-500">{user.Fecha_registro}</td>
                                    <td className="px-8 py-6">
                                        <span className={`flex items-center gap-2 text-xs font-bold ${user.status === 'Verificado' ? 'text-green-600' : 'text-gray-400'}`}>
                                            {user.status === 'Verificado' ? <CheckCircle size={14} /> : <Clock size={14} />} {user.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button onClick={() => handleEditUser(user)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Editar Usuario">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => {
                                            if(window.confirm("¿Eliminar a este usuario del ecosistema?")){
                                                handleDeleteUser(user.id);
                                            }
                                        }}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        title="Eliminar Usuario"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Modal de Registro de Usuario */}
                {isRegisterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1A1A1A] p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-full hexagon-pattern opacity-10"></div>
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <UserPlus className="text-[#FFBF00]" /> Alta de Usuario Pro-AI
                            </h3>
                            <p className="text-white/60 text-sm mt-1">Registra manualmente un nuevo integrante en el ecosistema.</p>
                        </div>
                        <form className="p-8 space-y-6" onSubmit={handleRegisterUser}>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="Ej: Roberto Alarcón" 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-[#FFBF00] transition-colors"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="usuario@dominio.com" 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-[#FFBF00] transition-colors"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Rol Asignado</label>
                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setNewUser({...newUser, role: 'AGRICULTOR'})}
                                        className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-all ${newUser.role === 'AGRICULTOR' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        Agricultor
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNewUser({...newUser, role: 'APICULTOR'})}
                                        className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-all ${newUser.role === 'APICULTOR' ? 'bg-yellow-50 border-[#FFBF00] text-[#1A1A1A]' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        Apicultor
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="flex-1 border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 bg-[#FFBF00] text-[#1A1A1A] py-4 rounded-2xl font-bold shadow-lg shadow-yellow-200 transition-all hover:scale-105">Confirmar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
                )}
            </div>
        );
    }

        //////////////////////// REPORTE AMBIENTAL /////////////////////////////////////////////////
    
    if (activeTab === 'impact') {
    // --- LÓGICA DE DATOS REALES ---
    const contratosPagadosReal = realContracts ? realContracts.filter((c: any) => c.status === 'Pagado') : [];
    const totalColmenasActivas = contratosPagadosReal.reduce((acc, curr) => acc + (Number(curr.cantidad_panales) || 0), 0);
    const abejasActivas = (totalColmenasActivas * 50000).toLocaleString(); 
    const hectareasGestionadas = solicitudes ? solicitudes.reduce((acc, curr) => acc + (Number(curr.hectareas) || 0), 0) : 0;
    const eficienciaPromedio = offersList.filter(o => o.status === 'Aprobada').length > 0
        ? Math.round(offersList.filter(o => o.status === 'Aprobada').reduce((acc, curr) => acc + (curr.efficiency || 0), 0) / offersList.filter(o => o.status === 'Aprobada').length)
        : 94;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-in zoom-in-95 duration-500">
            {/* ESTILO PARA LIMPIAR EL PDF */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; color: black !important; }
                    nav, .no-print, button, .absolute { display: none !important; }
                    .print-only { display: block !important; }
                    #diseno-pantalla { display: none !important; }
                }
                .print-only { display: none; }
            `}} />

            {/* --- DISEÑO PREMIUM PARA PANTALLA --- */}
            <div id="diseno-pantalla" className="bg-[#1A1A1A] p-8 md:p-16 rounded-[2rem] md:rounded-[3.3rem] text-white text-center relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 left-0 w-full h-full hexagon-pattern opacity-10 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <FileBadge size={64} className="text-[#FFBF00] mx-auto mb-8 animate-float" />
                    <h2 className="text-5xl font-bold mb-6 italic">BeePoliniza <span className="text-[#FFBF00]">Impact</span></h2>
                    
                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Este certificado avala la actividad técnica y biológica gestionada a través de nuestra plataforma <span className="text-white font-bold">Pro-AI Ecosystem</span> en la temporada actual.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 text-left">
                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-all border-b-4 border-b-[#FFBF00]">
                            <Zap className="text-[#FFBF00] mb-4" size={32} />
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Abejas en Campo</p>
                            <p className="text-3xl font-bold text-white">{abejasActivas}</p>
                            <p className="text-xs text-yellow-500 font-bold mt-1 italic">Fuerza Biológica Activa</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-all border-b-4 border-b-blue-500">
                            <MapPin className="text-blue-500 mb-4" size={32} />
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Área Protegida</p>
                            <p className="text-3xl font-bold text-white">{hectareasGestionadas} ha</p>
                            <p className="text-xs text-blue-400 font-bold mt-1">Polinización de Precisión</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-all border-b-4 border-b-green-500">
                            <Activity className="text-green-500 mb-4" size={32} />
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Score de Calidad</p>
                            <p className="text-3xl font-bold text-white">{eficienciaPromedio}%</p>
                            <p className="text-xs text-green-400 font-bold mt-1">Promedio de Red Verificada</p>
                        </div>
                    </div>

                    {/* SECCIÓN DE FIRMA DIGITAL */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] mb-12 text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Firma Digital del Administrador</p>
                        <div className="bg-white rounded-2xl overflow-hidden h-32 max-w-md mx-auto shadow-inner">
                            <SignatureCanvas 
                                ref={sigCanvasAdmin}
                                penColor='black'
                                canvasProps={{
                                    width: typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 500, 
                                    height: 128, 
                                    className: 'sigCanvas mx-auto'
                                }}
                                onEnd={() => {
                                    const dataUrl = sigCanvasAdmin.current.getCanvas().toDataURL('image/png');
                                    setAdminSignature(dataUrl);
                                }}
                            />
                        </div>
                        <div className="text-center mt-2">
                            <button 
                                type="button"
                                onClick={() => { sigCanvasAdmin.current.clear(); setAdminSignature(null); }}
                                className="text-[9px] text-gray-500 hover:text-[#FFBF00] font-bold uppercase transition-colors"
                            >
                                Limpiar trazo de firma
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#FFBF00]/5 border border-[#FFBF00]/20 p-8 rounded-[2rem] mb-12 text-left flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold text-white mb-1 uppercase tracking-tighter">Resumen Operativo de Red</p>
                            <p className="text-xs text-gray-400 max-w-sm">Datos consolidados de {usersList.length} usuarios y {contratosPagadosReal.length} contratos validados.</p>
                        </div>
                        <div className="flex -space-x-3">
                            {usersList.slice(0, 4).map((u, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                                    {u.name?.charAt(0)}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-[#FFBF00] text-[#1A1A1A] flex items-center justify-center text-[10px] font-bold">
                                +{usersList.length}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setTimeout(() => window.print(), 100)} 
                        className="bg-white text-[#1A1A1A] px-12 py-5 rounded-2xl font-black hover:bg-[#FFBF00] transition-all flex items-center gap-3 mx-auto shadow-2xl active:scale-95"
                    >
                        <Download size={24} /> DESCARGAR REPORTE OPERATIVO (PDF)
                    </button>
                    
                    <p className="text-[10px] text-gray-600 mt-8 uppercase tracking-[0.4em]">BeePoliniza IOT Tracking System • 2026</p>
                </div>
            </div>

            {/* --- DISEÑO EXCLUSIVO PARA EL PDF (HOJA BLANCA DETALLADA) --- */}
            <div className="print-only text-black p-10 bg-white">
                <div className="flex justify-between items-center border-b-8 border-[#FFBF00] pb-6 mb-10">
                    <h1 className="text-4xl font-black italic">BeePoliniza <span className="text-[#FFBF00]">Impact</span></h1>
                    <div className="text-right text-[10px] font-bold text-gray-400 uppercase">
                        <p>Reporte de Auditoría Digital</p>
                        <p>Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10 text-left">
                    <div className="bg-gray-50 p-6 rounded-3xl border">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4">Impacto Biológico</h3>
                        <p className="text-sm">Abejas en Campo: <b>{abejasActivas}</b></p>
                        <p className="text-sm">Área Polinizada: <b>{hectareasGestionadas} ha</b></p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4">Métricas de Red</h3>
                        <p className="text-sm">Contratos Totales: <b>{contratosPagadosReal.length}</b></p>
                        <p className="text-sm">Eficiencia Red: <b>{eficienciaPromedio}%</b></p>
                    </div>
                </div>

                <h3 className="text-sm font-black uppercase mb-4 text-left border-l-4 border-[#FFBF00] pl-2">Detalle de Operaciones Validadas</h3>
                <table className="w-full text-[10px] border mb-10">
                    <thead className="bg-gray-100 font-bold uppercase">
                        <tr>
                            <th className="p-3 border">Partner / Fundo</th>
                            <th className="p-3 border">Capacidad</th>
                            <th className="p-3 border">Total</th>
                            <th className="p-3 border">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratosPagadosReal.slice(0, 8).map((c: any) => (
                            <tr key={c.id}>
                                <td className="p-3 border font-bold">{c.partner}</td>
                                <td className="p-3 border">{c.cantidad_panales} Colmenas</td>
                                <td className="p-3 border font-bold">S/ {c.total}</td>
                                <td className="p-3 border text-green-600 font-bold">VERIFICADO IOT</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="avoid-break mt-10">
                    <div className="flex justify-between items-end">
                        <div className="text-center w-48">
                            <div className="h-12 flex items-center justify-center mb-1">
                                {adminSignature && <img src={adminSignature} alt="Firma" className="max-h-full mix-blend-multiply" />}
                            </div>
                            <div className="h-0.5 bg-black w-full mb-1"></div>
                            <p className="text-[8px] font-black uppercase">Firma Administrador</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400">CERTIFICADO OFICIAL PRO-AI</p>
                        </div>
                    </div>

                    
                </div>
            </div>
        </div>
    );
}    
            
        

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center opacity-50">
            <Users size={64} className="mb-6" />
            <h2 className="text-2xl font-bold">Módulo Administrativo</h2>
            <p>Control total del ecosistema BeePoliniza Pro-AI.</p>
        </div>
    );
    };

export default AdminView;