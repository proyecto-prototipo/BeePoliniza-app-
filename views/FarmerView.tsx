import { supabase } from '../supabaseClient';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import ApiarioCarousel from '../components/ApiarioCarousel';
import SignatureCanvas from 'react-signature-canvas';
//import './App.css'; 
import { OFFERS, CONTRACTS, HIVES_MOCK } from '../constants'; './types' ;
import { 
  CheckCircle, 
  ArrowRight, 
  Download, 
  Thermometer, 
  Droplets, 
  Activity, 
  MapPin, 
  ShoppingBag, 
  FileText, 
  Map, 
  Clock,
  BarChart3, 
  Settings,
  HelpCircle,
  ChevronDown,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  X,
  Plus,
  Zap,
  Search,
  TrendingUp,
  ArrowUpRight,
  Map as MapIcon,
  Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell,AreaChart, Area 

} from 'recharts';

const beeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

// Icono para la ubicación del usuario (Punto Azul)
const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `
    <div style="display: flex; items-center; justify-center; position: relative; width: 40px; height: 40px;">
      <div class="pulse-ring" style="top: 10px; left: 10px;"></div>
      
      <div class="inner-dot" style="margin-top: 10px; margin-left: 10px;"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const userLocationIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
      <div style="
        background-color: #3b82f6;
        width: 14px; 
        height: 14px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
        z-index: 2;
      "></div>
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        z-index: 1;
      "></div>
    </div>
    `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});


const dataPerformance = [
  { name: 'Sem 1', impact: 10 },
  { name: 'Sem 2', impact: 25 },
  { name: 'Sem 3', impact: 45 },
  { name: 'Sem 4', impact: 68 },
  { name: 'Sem 5', impact: 82 },
  { name: 'Sem 6', impact: 95 },
];

const position = [-12.095959902097645, -77.07680942362022]

const FarmerView: React.FC<{ activeTab: string, setActiveTab: (t: string) => void, currentUser: any }> = ({ activeTab, setActiveTab, currentUser }) => {  
  const mapRef = useRef<L.Map | null>(null);
  
  const [selectedHive, setSelectedHive] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [requestedOffers, setRequestedOffers] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState("Más reciente"); // Antes era selectedRegion
  const [selectedRegion, setSelectedRegion] = useState("Todas");
  const [selectedCrop, setSelectedCrop] = useState("Todos");

  const [negociaciones, setNegociaciones] = useState([]);

  // Añade esto arriba, antes de FarmerView
const MapResizer = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      if (center) map.setView(center, map.getZoom());
    }, 100);
  }, [map, center]);
  return null;
};


  const [puntos, setPuntos] = useState<any[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newPunto, setNewPunto] = useState({ nombre: '', lat: -12.04637, lng: -77.04279, temp: 35, hum: 60, detalles: '', notas: '' });

  const [editingPunto, setEditingPunto] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
/////metricas////
  const [solicitudes, setSolicitudes] = useState([]);

  // --- NUEVOS ESTADOS PARA SUPABASE ---
  const [realContracts, setRealContracts] = useState<any[]>([]);
  const [marketOffers, setMarketOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fundo: '',
    hectareas: '',
    fecha: '',
    fecha_salida: '', // Agregado
    cultivo: '',      // Agregado
    notas: ''
});


////////////////////delivery//////////////////////////
const [deliveryLocation, setDeliveryLocation] = useState("");
const [isDetecting, setIsDetecting] = useState(false);


////////////nueva ventana - nueva orden BEETRACK IOT/////////////////////////////
const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
const [newOrder, setNewOrder] = useState({
    cliente: '',
    cantidadPanales: 10,
    duracion: 12,
    lat: '',
    lng: '',
    notas: ''
});

const MapViewUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
};

////////////////////contratos/////////////////////////
const [isSigning, setIsSigning] = useState(false);
const [selectedContractForSign, setSelectedContractForSign] = useState<any>(null);

const sigCanvas = useRef<any>(null);

const handleSaveAgricultorSignature = async (firmaBase64: string) => {
  if (!selectedContractForSign) return;

  try {
    const { error } = await supabase
      .from('contratos')
      .update({ 
        firma_agricultor: firmaBase64, // Guardamos en la columna del agricultor
        status: 'Pagado' // Aseguramos que el estado sea Pagado
      })
      .eq('id', selectedContractForSign.id);

    if (error) throw error;

    setRealContracts(prev => 
      prev.map(c => c.id === selectedContractForSign.id 
        ? { ...c, status: 'Pagado', firma_agricultor: firmaBase64 } 
        : c
      )
    );

    setIsSigning(false);
    alert("✅ Firma registrada con éxito.");
  } catch (err: any) {
    alert("Error al guardar: " + err.message);
  }
};



///////////////////////ofertas////////////////////////////////
const handleOpenOffer = (offer: any) => {
    setSelectedOffer(offer);
    setIsOfferModalOpen(true);
};

// 1. Definimos la función afuera para que todos puedan usarla
const fetchData = async () => {
  if (!currentUser?.id) {
    console.log("⚠️ No hay currentUser ID");
    setLoading(false);
    return;
  }

  console.log("🔍 Iniciando carga para usuario ID:", currentUser.id);

  try {
    const [puntosRes, contractsRes, solicitudesRes, offersRes] = await Promise.all([
      supabase.from('puntos_monitoreo').select('*'),
      supabase.from('contratos')
        .select(`*, apicultor:usuarios!apicultor_id(name), agricultor:usuarios!agricultor_id(name)`)
        .eq('agricultor_id', currentUser.id) // Quitamos el Number()
        .order('id', { ascending: false }),
      supabase.from('solicitudes').select('*').eq('user_id', currentUser.id), // Quitamos el Number()
      supabase.from('ofertas').select('*')
    ]);

    console.log("📊 Puntos encontrados:", puntosRes.data?.length || 0);
    console.log("📊 Contratos encontrados:", contractsRes.data?.length || 0);
    console.log("📊 Ofertas Marketplace encontradas:", offersRes.data?.length || 0);

    if (offersRes.error) console.error("❌ Error en Ofertas:", offersRes.error);
    if (contractsRes.error) console.error("❌ Error en Contratos:", contractsRes.error);


    // --- LÓGICA ANTIDUPLICADOS ---
    const mapaUnificado = new window.Map();
    puntosRes.data?.forEach(p => {
      if (p.lat && p.lng) {
        const key = `${Number(p.lat).toFixed(4)}|${Number(p.lng).toFixed(4)}`;
        mapaUnificado.set(key, { ...p, origen: 'sensor' });
      }
    });

    // 1. Cargamos puntos de monitoreo (Prioridad: Datos de sensores)
    puntosRes.data?.forEach(p => {
      // Validación extra para que toFixed no rompa el código si lat/lng fallan
      const lat = parseFloat(p.lat);
      const lng = parseFloat(p.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const key = `${lat.toFixed(4)}|${lng.toFixed(4)}`;
        mapaUnificado.set(key, { ...p, origen: 'sensor' });
      }
    });

    // 2. Cargamos puntos de ofertas (Si no existe ya un sensor ahí)
    offersRes.data?.filter(off => off.lat && off.lng).forEach(off => {
      const key = `${Number(off.lat).toFixed(4)}|${Number(off.lng).toFixed(4)}`;
      if (!mapaUnificado.has(key)) {
        mapaUnificado.set(key, {
          id: `off-${off.id}`,
          nombre: off.apiario_nombre || off.provider,
          lat: off.lat,
          lng: off.lng,
          temp: 24,
          hum: 60,
          detalles: `Oferta activa: ${off.crop_type}`,
          origen: 'oferta'
        });
      }
    });

    setPuntos(Array.from(mapaUnificado.values()));
    
    // --- RESTO DE SETEOS ---
    if (solicitudesRes.data) setSolicitudes(solicitudesRes.data);

    if (contractsRes.data) {
      setRealContracts(contractsRes.data);
      const ids = contractsRes.data.map(c => c.offer_id).filter(Boolean);
      setRequestedOffers(ids);
    }

    if (offersRes.data) {
      setMarketOffers(offersRes.data);
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => console.log("Geo bloqueada"));
    }

  } catch (err) {
    console.error("Error crítico en carga:", err);
  } finally {
    setTimeout(() => setLoading(false), 500);
  }
};

// 2. El useEffect ahora solo llama a la función cuando carga la página
useEffect(() => {
  fetchData();
  
  // Suscripción en tiempo real optimizada
  const channel = supabase
    .channel('cambios-contratos')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contratos' }, 
    (payload) => {
      setRealContracts(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [currentUser?.id]);


  
 //////////////base de datos solicitudes///////////////////
  const handleRequestService = async (offer) => {
    const cantidadSolicitada = Number(formData.hectareas || 0);
    const totalReal = cantidadSolicitada * offer.price;
    const nuevoStock = offer.hive_count - cantidadSolicitada;

  try {
    // Escribimos directamente en la tabla que ambos comparten
    const { error: errorContrato } = await supabase
      .from('contratos')
      .insert([{ 
          offer_id: offer.id,
          apicultor_id: Number(offer.user_id), 
          agricultor_id: Number(currentUser?.id),
          partner: offer.provider || offer.apiario_nombre,
          total: totalReal,
          status: 'Pendiente', // El apicultor verá esto como "Pendiente"
          date: new Date().toISOString(),
          location: deliveryLocation || formData.fundo,
          cultivo: offer.crop_type || 'General', 
          cantidad_panales: cantidadSolicitada,
          notas: `Pedido de ${cantidadSolicitada} colmenas.`
      }]);

    if (errorContrato) throw errorContrato;

    const { error: errStock } = await supabase
      .from('ofertas')
      .update({ 
          hive_count: nuevoStock,
          // Si llega a 0, podrías ponerle status: 'Agotado'
          status: nuevoStock <= 0 ? 'Agotado' : 'Disponible'
      })
      .eq('id', offer.id);

    if (errStock) throw errStock;
    
    alert("✅ Solicitud enviada. El apicultor ya puede verla en su menú de Negociaciones.");
    setIsOfferModalOpen(false);
    fetchData();

    setRequestedOffers(prev => [...prev, offer.id]);

  } catch (err) {
    alert("Error: " + err.message);
  }
};

 ///////////////////////////////////////////////////////////////////////////////////////////////////


////////////solicitar - contratos////////////////

const handleSolicitar = async (offer: any) => {
  try {
    // 1. Insertamos en la tabla de contratos/solicitudes
    const { data, error } = await supabase
            .from('contratos')
            .insert([{ 
                offer_id: offer.id,
                agricultor_id: Number(currentUser?.id),
                partner: offer.provider || offer.apiario_nombre,
                total: offer.price,
                status: 'Pendiente',
                date: new Date().toISOString(),
                location: deliveryLocation,
                cultivo: offer.crop_type || 'General', 
                cantidad_panales: offer.hive_count || 0,
                duracion_meses: 1, // Puedes hacerlo dinámico si gustas
                notas: `Fundo: ${formData.fundo}. Área: ${formData.hectareas} ha. Notas: ${formData.notas || 'Sin notas'}`
            }])
            .select();

    if (error) {
      console.error("Error de Supabase:", error); // Esto nos dirá el fallo real
      throw error;
    }

    // 2. Actualizamos el estado local para que la pestaña de Contratos se refresque
    setRealContracts(prev => [data[0], ...prev]);
    setRequestedOffers(prev => [...prev, offer.id]);
    setDeliveryLocation("");
    alert("✅ ¡Solicitud y ubicación enviadas con éxito!");

  } catch (err: any) {
        alert("Error al guardar ubicación: " + err.message);
  }
};


const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("Todos");

///////////métricas/////////////////////

// 1. Calculamos las hectáreas reales sumando lo que hay en la tabla 'solicitudes'
const totalHectareasReales = solicitudes.reduce((acc, curr) => acc + (Number(curr.hectareas) || 0), 0);

// 2. Calculamos el ROI basado en el costo total de las solicitudes vs una proyección de ganancia
const totalInversion = solicitudes.reduce((acc, curr) => acc + (Number(curr.monto_total) || 0), 0);
const roiCalculado = totalInversion > 0 ? (totalInversion * 4.2 / totalInversion).toFixed(1) : "0.0";

// 3. Preparamos los datos para el gráfico de barras (Eficiencia por Proveedor)
// Usamos los datos que vienen del Marketplace
const chartBarData = marketOffers.map(offer => ({
    name: offer.provider.split(' ')[0], // Solo el primer nombre para que quepa bien
    eficiencia: offer.efficiencyScore || 85 // Usamos el score real de la oferta
}));

  const faqs = [
    {
      q: "¿Cómo garantizan la salud de las abejas en mi campo?",
      a: "Utilizamos sensores IoT de última generación que monitorean temperatura, humedad y niveles de CO2 dentro de la colmena 24/7. Si algún parámetro se sale de rango, nuestro sistema alerta automáticamente al apicultor para una intervención inmediata."
    },
    {
      q: "¿Qué es el 'Score de Eficiencia' que veo en las ofertas?",
      a: "Es un índice calculado por nuestra IA basado en el historial de rendimiento del apicultor, la fortaleza biológica de sus colonias y su especialización en el tipo de cultivo que tú necesitas."
    },
    {
      q: "¿Cómo se gestionan los pagos y contratos?",
      a: "BeePoliniza utiliza contratos inteligentes digitales. El pago se mantiene en garantía y se libera al apicultor una vez que el sistema BeeTrack confirma que se ha cumplido el tiempo y la actividad de polinización acordada."
    },
  ];

    if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFBF00]"></div>
        </div>
    );
    }

    //////////////////////////////VISTA INICIO////////////////////////////


  if (activeTab === 'inicio') {
    return (
      <div className="max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
        <section className="relative rounded-[2rem] overflow-hidden bg-[#1A1A1A] text-white p-8 md:p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 hexagon-pattern pointer-events-none"></div>
            <div className="flex-1 space-y-6 z-10">
                <span className="bg-[#FFBF00] text-[#1A1A1A] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Tecnología de Punta</span>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">Optimiza tu cosecha con <span className="text-[#FFBF00]">Polinización de Precisión</span></h2>
                <p className="text-xl text-gray-400 max-w-xl">Aumenta hasta un 40% el rendimiento de tus cultivos utilizando nuestra red de colmenas inteligentes monitoreadas por IA.</p>
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('market')} className="bg-[#FFBF00] text-[#1A1A1A] px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center gap-2">
                        Explorar Ofertas <ArrowRight size={20} />
                    </button>
                    <button className="border border-white/20 hover:bg-white/5 px-8 py-4 rounded-xl font-bold transition-all">Saber más</button>
                </div>
            </div>
            <div className="flex-1 relative z-10 flex justify-center">
                <img src="/panal.jpg" alt="AgTech" className="rounded-3xl shadow-2xl animate-float border-4 border-white/10" />
            </div>
        </section>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all group">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFBF00] mb-6 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Selecciona</h3>
                <p className="text-gray-500">Busca apicultores verificados en tu zona y filtra por tipo de cultivo específico.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all group">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFBF00] mb-6 group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Contrata</h3>
                <p className="text-gray-500">Firma contratos inteligentes digitales con seguros de cumplimiento automatizados.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all group">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFBF00] mb-6 group-hover:scale-110 transition-transform">
                    <Map size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Monitorea</h3>
                <p className="text-gray-500">Sigue en tiempo real la salud de las abejas y la actividad de polinización en tu campo.</p>
            </div>
        </section>
      </div>
    );
  }

    //////////////////////////////VISTA MARKETPLACE////////////////////////////


  if (activeTab === 'market') {
    // 1. Lógica de filtrado recuperada y corregida
    const filteredOffers = marketOffers.filter(offer => {
        // Filtro de Cultivo: Si es "Todos" o no hay nada seleccionado, pasa.
        const cumpleCultivo = !selectedCrop || selectedCrop === "Todos" || (offer.crop_type?.toLowerCase() === selectedCrop.toLowerCase());
        // Filtro de Región: Usamos 'selectedRegion' para filtrar (asegúrate que en Supabase la columna se llame 'region')
        const cumpleRegion = !selectedRegion || selectedRegion === "Todas" || 
            (offer.region?.toLowerCase() === selectedRegion.toLowerCase());

        return cumpleCultivo && cumpleRegion;

    }).sort((a, b) => {
        // Ordenamiento dinámico
        if (sortBy === "Más reciente") return (b.id || 0) - (a.id || 0);
        if (sortBy === "Mayor Stock") return (Number(b.hive_count) || 0) - (Number(a.hive_count) || 0);
        return 0;
    });

    const cultivosUnicos = ["Todos", ...new Set(marketOffers.map(o => o.crop_type).filter(Boolean))];
    const regionesUnicas = ["Todas", ...new Set(marketOffers.map(o => o.region).filter(Boolean))];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 md:mb-12">
            <div>
                <h2 className="text-4xl font-bold mb-2">Marketplace de Polinización</h2>
                <p className="text-gray-500">Encuentra la mejor calidad biológica para tus frutales.</p>
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 w-full md:w-auto">
                {/* Selector de Ordenamiento */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ordenar por</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[#FFBF00]"
                    >
                        <option value="Más reciente">Más reciente</option>
                        <option value="Más antiguo">Más antiguo</option>
                        <option value="Mayor Stock">Mayor Stock</option>
                    </select>
                </div>

                {/* Selector de Región */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Región</span>
                    <select 
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[#FFBF00]"
                    >
                        <option value="Todas">Todas</option>
                        {[...new Set(marketOffers.map(o => o.region).filter(Boolean))].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                
                {/* Selector de Cultivo */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cultivo</span>
                    <select 
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[#FFBF00]"
                    >
                        {cultivosUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* REJILLA DE OFERTAS: DISEÑO ORIGINAL RECUPERADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredOffers.length > 0 ? (
            filteredOffers.map((offer) => {
              const isAgotado = (offer.hive_count <= 0) || (offer.status === 'Agotado');
              // Verificamos si este usuario ya solicitó esta oferta específica
              const yaSolicitado = realContracts.some(c => c.offer_id === offer.id && c.agricultor_id === currentUser?.id);

              return (
                  <div key={offer.id} 
                      className={`bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 transition-all group flex flex-col ${
                          isAgotado ? 'opacity-75 grayscale' : 'hover:shadow-xl'
                      }`}>
                      
                      <div className="relative h-48 overflow-hidden">
                          {offer.images_urls && offer.images_urls.length > 0 ? (
                              <ApiarioCarousel images={offer.images_urls} className="w-full h-full" />
                          ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Sin fotos</div>
                          )}

                          {/* Badge de Disponibilidad */}
                          <div className={`absolute top-6 left-6 z-10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${
                              isAgotado ? 'bg-red-500 text-white' : 'bg-[#FFBF00] text-[#1A1A1A]'
                          }`}>
                              {isAgotado ? 'Agotado' : (offer.status || 'Disponible')}
                          </div>
                        
                          {/* Badge de Región */}
                          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                              {offer.region || 'Perú'}
                          </div>

                          {/* Badge de Eficiencia */}
                          <div className="absolute bottom-4 left-4 z-10 flex gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isAgotado ? 'bg-gray-400 text-white' : 'bg-[#FFBF00] text-[#1A1A1A]'
                              }`}>
                                  ★ {offer.efficiency || 95}% Eficiencia
                              </span>
                          </div>
                      </div>
                      
                      <div className="p-6 flex-grow flex flex-col">
                          <h4 className={`font-bold text-lg mb-1 ${isAgotado ? 'text-gray-500' : 'text-[#1A1A1A]'}`}>
                              {offer.provider}
                          </h4>
                          <p className="text-gray-400 text-xs mb-4">Especialista en: {offer.crop_type || 'General'}</p>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                              <div>
                                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Colmenas</span>
                                  <span className={`font-bold ${isAgotado ? 'text-red-500' : ''}`}>
                                      {offer.hive_count || 0}
                                  </span>
                              </div>
                              <div className="text-right">
                                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Precio Unit.</span>
                                  <span className={`${isAgotado ? 'text-gray-400' : 'text-[#FFBF00]'} font-bold text-lg`}>
                                      S/.{offer.price}
                                  </span>
                              </div>
                          </div>

                          <button 
                            onClick={() => !isAgotado && (offer.status === 'Aprobada' || offer.status === 'Disponible') && handleOpenOffer(offer)}
                            // El botón se deshabilita si está agotado, ya solicitado o NO es Aprobada/Disponible
                            disabled={isAgotado || yaSolicitado || (offer.status !== 'Aprobada' && offer.status !== 'Disponible')} 
                            className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                (isAgotado || (offer.status !== 'Aprobada' && offer.status !== 'Disponible'))
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // Estilo bloqueado/gris
                                  : yaSolicitado 
                                    ? 'bg-green-100 text-green-700 border border-green-200 cursor-default' 
                                    : 'bg-[#1A1A1A] text-white hover:bg-[#FFBF00] hover:text-[#1A1A1A]' // Estilo activo
                            }`}
                          >
                            { (offer.status !== 'Aprobada' && offer.status !== 'Disponible') ? (
                              <><Clock size={18} /> En revisión por Admin</>
                            ) : isAgotado ? (
                                <>Agotado temporalmente</>
                            ) : yaSolicitado ? ( 
                                <><CheckCircle size={18} strokeWidth={3} /> Solicitud Enviada</>
                            ) : (
                                <><ShoppingBag size={18} /> Ver Oferta</>
                            )}
                          </button>
                      </div>
                  </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No se encontraron ofertas con estos filtros.</p>
              <button onClick={() => {setSelectedCrop("Todos"); setSelectedRegion("Todas");}} className="mt-4 text-[#FFBF00] font-bold underline">Limpiar filtros</button>
            </div>
          )}
        </div>

        {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Contenedor principal del Modal - Máximo ancho aumentado a 5xl */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-5xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[90vh] max-h-[95vh]">
            
            {/* LADO IZQUIERDO: DETALLES Y FOTO (Ocupa más espacio) */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white shrink-0">
              
                {/* Espacio para la FOTO - Ahora se verá en el recuadro grande */}
                 <div className="w-full aspect-video md:aspect-square lg:aspect-video bg-gray-100 rounded-[1.5rem] md:rounded-[2rem] mb-4 md:mb-8 overflow-hidden border border-gray-100 shadow-inner">
                    {/* 🔍 Verificación en tiempo real: si esto sale en pantalla, es que NO hay links */}
                    {!selectedOffer.images_urls || selectedOffer.images_urls.length === 0 ? (
                        <img 
                            src={`https://picsum.photos/seed/${selectedOffer.id}/800/600`} 
                            className="w-full h-full object-cover grayscale opacity-50" 
                            alt="Apiario"
                        />
                    ) : (
                        <ApiarioCarousel 
                            images={selectedOffer.images_urls} 
                            className="h-full w-full" 
                        />
                    )}
                </div>

                {/* Información del Apicultor */}
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-bold text-[#1A1A1A]">{selectedOffer.provider}</h3>
                            <p className="text-gray-500 flex items-center gap-2 mt-1">
                                <MapPin size={16} className="text-[#FFBF00]" /> Lima, Perú · Especialista en {selectedOffer.crop_type || 'General'}
                            </p>
                        </div>
                        <div className="bg-yellow-50 px-4 py-2 rounded-2xl">
                            <span className="text-[#FFBF00] font-bold">★ {selectedOffer.efficiency || 95}% Eficiencia</span>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-6"></div>

                    {/* ✅ SECCIÓN DE CONFIANZA ACTUALIZADA: Basada en el punto 1 que acordamos */}
                    <div className="bg-yellow-50/50 p-6 rounded-3xl border border-yellow-100 mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado Sanitario</span>
                                <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                                    <ShieldCheck size={16} /> Verificado y Sano
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Capacidad Logística</span>
                                <div className="flex items-center gap-1.5 text-[#1A1A1A] font-bold text-sm">
                                    <Activity size={16} /> {selectedOffer.hive_count || selectedOffer.hiveCount} Colmenas listas
                                </div>
                            </div>
                        </div>
                        
                        {/* ✅ TEXTO DE IA SIMULADA: Basado en el perfil y no en sensores IoT */}
                        <p className="text-gray-600 text-xs leading-relaxed italic border-l-2 border-[#FFBF00] pl-4">
                            "Análisis BeePoliniza: Este apicultor cumple con los estándares biológicos de la plataforma. 
                            Sus colmenas han pasado por una validación de fortaleza y sanidad para garantizar la 
                            polinización óptima de tus cultivos de {selectedOffer.crop_type || 'frutales'}."
                        </p>
                    </div>

                    {/* Nota aclaratoria sobre el proceso */}
                    <p className="text-gray-400 text-[11px] leading-relaxed italic">
                        * La eficiencia biológica es calculada en base al historial de servicios exitosos y la calificación de otros agricultores en la plataforma.
                    </p>
                </div>
            </div>

            {/* LADO DERECHO: EL FORMULARIO (Diseño flotante de tu prototipo) */}
            <div className="w-full md:w-[400px] lg:w-[450px] bg-gray-50/30 p-6 md:p-10 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">                
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 custom-scrollbar">

                    <div className="mb-8">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Precio por colmena</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold text-[#1A1A1A]">S/ {selectedOffer.price}</span>
                        <span className="text-gray-400 text-xs">/ unidad</span>
                    </div>
                    </div>

                    <form className="space-y-6" 
                    onSubmit={async (e) => {
                        e.preventDefault();

                        await handleRequestService(selectedOffer);

                        setIsOfferModalOpen(false);
    
                    }}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Nombre del Fundo</label>
                            <input 
                                required 
                                type="text" 
                                placeholder="¿Dónde será el servicio?"
                                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none focus:border-[#FFBF00] focus:ring-4 focus:ring-yellow-50/50 transition-all shadow-sm" 
                                onChange={(e) => setFormData({...formData, fundo: e.target.value})}                            
                           />
                        </div>

                      <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">
                            Cantidad de Colmenas (Disponibles: {selectedOffer.hive_count})
                          </label>
                          
                          <input 
                          required 
                          type="number" 

                          min="1"
                          max={selectedOffer.hive_count} 
                          placeholder={`Máximo ${selectedOffer.hive_count}`}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none focus:border-[#FFBF00] shadow-sm" 
                          onChange={(e) => {
                              const val = parseInt(e.target.value);
                              // Si el usuario intenta escribir más del stock, lo reseteamos al máximo
                              if (val > selectedOffer.hive_count) {
                                  alert(`Solo quedan ${selectedOffer.hive_count} colmenas disponibles.`);
                                  setFormData({...formData, hectareas: selectedOffer.hive_count.toString()});
                                  e.target.value = selectedOffer.hive_count.toString();
                              } else {
                                  setFormData({...formData, hectareas: e.target.value});
                              }
                          }}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Llegada</label>
                          <input required type="date" className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#FFBF00] shadow-sm" 
                              onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Salida</label>
                          <input required type="date" className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#FFBF00] shadow-sm" 
                          onChange={(e) => setFormData({...formData, fecha_salida: e.target.value})} />
                          </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Punto de Entrega (Delivery)</label>
                        

                        <div className="relative">
                            <input 
                              type="text" 
                              value={deliveryLocation}
                              onChange={(e) => setDeliveryLocation(e.target.value)}
                              placeholder="Ingresa la dirección o fundo..."
                              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFBF00] transition-all pr-12"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                setIsDetecting(true);
                                if (navigator.geolocation) {
                                  navigator.geolocation.getCurrentPosition((position) => {
                                    // Aquí obtenemos latitud y longitud
                                    const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                                    setDeliveryLocation(`Ubicación GPS: ${coords}`);
                                    setIsDetecting(false);
                                  }, () => {
                                    alert("No se pudo obtener la ubicación automáticamente.");
                                    setIsDetecting(false);
                                  });
                                }
                              }}
                              className={`absolute right-2 top-2 p-2 rounded-xl transition-all ${isDetecting ? 'animate-pulse bg-yellow-100' : 'bg-white hover:bg-gray-100 shadow-sm'}`}
                              title="Usar mi ubicación actual"
                            >
                              <MapPin size={20} className={isDetecting ? 'text-[#FFBF00]' : 'text-gray-400'} />
                            </button>
                          </div>

                          <p className="text-[10px] text-gray-400 italic">
                            * El apicultor usará esta ubicación para calcular la ruta de transporte.
                          </p>
                        </div>
                      </div>
                    <div className="mt-8 p-6 bg-[#1A1A1A] rounded-[2rem] text-white shadow-xl shadow-gray-200">
                        <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Estimado</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#FFBF00]">Contrato Digital</span>
                        </div>
                        <p className="text-3xl font-bold">
                        S/ {Number(formData.hectareas || 0) * selectedOffer.price}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2 leading-none italic">* Sujeto a validación del apicultor</p>
                    </div>

                    <div className="mt-4 px-2 py-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
                        <p className="text-[11px] text-blue-800 leading-relaxed ">
                            <span className="font-bold">¿Cómo funciona?</span> Al hacer clic en solicitar, el apicultor revisará la disponibilidad para tus fechas. Una vez aceptada, podrás realizar el pago seguro vía <span className="font-bold">Mercado Pago</span> en tu pestaña de Contratos.
                        </p>
                    </div>

                      <button type="submit" className="w-full bg-[#FFBF00] text-[#1A1A1A] py-5 rounded-2xl font-bold shadow-lg shadow-yellow-200 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                          Solicitar colmenas
                      </button>

                      <button type="button" onClick={() => setIsOfferModalOpen(false)} className="w-full text-gray-400 text-sm font-bold py-2 hover:text-[#1A1A1A] transition-all">
                          Volver al Marketplace
                      </button>
                    </form>
                  </div>
                </div>
            </div>
        </div>
        )}

      </div>
    );
  }

    //////////////////////////////VISTA BEETRACK IOT////////////////////////////
  // 1. Coordenadas centrales de Perú para el inicio
  // 1. Constantes de configuración fuera del componente
const PERU_CENTER: [number, number] = [-9.189967, -75.015152];

/**
 * SUB-COMPONENTE: Maneja la geolocalización del usuario
 * Se coloca dentro de MapContainer
 */

const LocationMarker = ({ setUserLocation, userLocation }: any) => {
  const map = useMap();
  const hasLocated = useRef(false);

  useEffect(() => {
    if (!hasLocated.current && !userLocation) {
      map.locate({ setView: true, maxZoom: 16 });
      map.on('locationfound', (e) => {
        setUserLocation([e.latlng.lat, e.latlng.lng]);
        hasLocated.current = true;
      });
    }
  }, [map, userLocation, setUserLocation]);

  return userLocation ? (
    <Marker position={userLocation} icon={userIcon}>
      <Popup><div className="text-center font-bold text-xs">Tu ubicación actual</div></Popup>
    </Marker>
  ) : null;
};

/**
 * SUB-COMPONENTE: Maneja los clics en el mapa para registrar puntos
 * Se coloca dentro de MapContainer
 */
const MapEvents = ({ puntos, setNewPunto, newPunto, setShowRegisterModal }: any) => {
  useMapEvents({
    click(e) {
      setNewPunto({
        ...newPunto,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        nombre: `Panal Sector ${puntos.length + 1}`
      });
      setShowRegisterModal(true);
    },
  });
  return null;
};


// --- DENTRO DE TU COMPONENTE PRINCIPAL FarmerView ---

if (activeTab === 'beetrack') {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 h-auto md:h-[calc(100vh-160px)] flex flex-col relative animate-in fade-in duration-500">
      
      {/* ENCABEZADO */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Map className="text-[#FFBF00]" /> BeeTrack Live IoT
          </h2>
          <p className="text-gray-500">"BeeTrack Live: Telemetría biológica y GPS de tus colmenas contratadas."</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            GPS Activo
          </div>
        </div>
      </div>

      {/* ÁREA DE MAPA Y PANEL */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-auto lg:h-[600px] min-h-[500px]">        
        {/* COLUMNA MAPA */}
        <div className="lg:col-span-3 h-[400px] lg:h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative z-0">
          <MapContainer 
            center={userLocation || position} 
            zoom={15} 
            ref={mapRef}
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }} // Esto asegura que llene el div padre
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation && (
              <>
                {/* Halo exterior transparente */}
                <CircleMarker
                  center={userLocation}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    weight: 0,
                  }}
                  radius={20}
                  className="animate-pulse" // Usamos la clase de Tailwind para el pulso rápido
                />
                {/* Punto azul sólido central */}
                <CircleMarker
                  center={userLocation}
                  pathOptions={{
                    color: 'white',
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  radius={7}
                >
                  <Popup><div className="text-center font-bold text-xs">Tu ubicación actual</div></Popup>
                </CircleMarker>
              </>
            )}

            {/* Marcadores de Panales */}
            {puntos.map((punto) => (
              <Marker 
                key={punto.id} 
                position={[Number(punto.lat), Number(punto.lng)]} // Forzamos a que sean números
                icon={beeIcon}
              >
                <Popup maxWidth={300}>
                  <div className="p-3 w-[240px] leading-tight">
                    <div className="flex justify-between items-start mb-2 border-b pb-2">
                      <h4 className="font-bold text-[#1A1A1A] truncate pr-2">{punto.nombre}</h4>
                      <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                        ACTIVO
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 mb-2">Sensor IoT: #{punto.id}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-100 text-center">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Temp.</p>
                        <p className="text-xs font-black">{punto.temp || '22'}°C</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-center">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Hum.</p>
                        <p className="text-xs font-black">{punto.hum || '12'}%</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Estado</p>
                      <p className="text-[11px] text-gray-600 italic leading-snug">
                        {punto.detalles || "Monitoreo estable"}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* COLUMNA LISTADO (PANEL DERECHO) */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-full overflow-hidden">
           <h3 className="font-bold text-xl mb-4 text-[#1A1A1A] flex items-center gap-2 shrink-0">
             <Zap size={18} className="text-[#FFBF00]" /> Puntos en Campo
           </h3>
           
           <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {puntos && puntos.length > 0 ? (
                puntos.map((p) => (
                    <div key={p.id} 
                     onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.flyTo([p.lat, p.lng], 18, {
                          duration: 1.5
                        });
                      }
                    }}

                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#FFBF00] transition-colors group cursor-pointer" >                  
                      
                      <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-yellow-400 p-2 rounded-lg text-white shrink-0">
                          <MapPin size={16} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate text-[#1A1A1A]">{p.nombre}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            Contrato: #{p.contrato_id || 'Red'} | {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded-full shrink-0"> 
                        ACTIVO
                      </span>
                    </div>
                  </div>
                  ))
                ) : (
                  /* Mensaje sutil si no hay nada en la base de datos todavía */
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-xs italic">Buscando colmenas activas...</p>
                  </div>
                )}
           </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE PUNTO */}
        {showEditModal && editingPunto && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-[#1A1A1A] p-6 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <Settings className="text-[#FFBF00]" /> Editar Punto
                </h3>
                <button onClick={() => { setShowEditModal(false); setEditingPunto(null); }} className="p-1 hover:text-[#FFBF00]"><X size={20} /></button>
              </div>
              
              <form className="p-8 space-y-5" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { error } = await supabase
                    .from('puntos_monitoreo')
                    .update({ 
                      nombre: editingPunto.nombre 
                    })
                    .eq('id', editingPunto.id);

                  if (error) throw error;

                  // Actualizar estado local
                  setPuntos(puntos.map(p => p.id === editingPunto.id ? editingPunto : p));
                  setShowEditModal(false);
                  setEditingPunto(null);
                  alert("Punto actualizado con éxito.");
                } catch (e: any) { alert(e.message); }
              }}>
                {/* Visualización de Coordenadas (Solo lectura para edición) */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Coordenadas (No editables)</p>
                  <span className="text-sm font-mono font-bold text-[#FFBF00]">{editingPunto.lat.toFixed(6)}, {editingPunto.lng.toFixed(6)}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Nombre del Sector/Panal</label>
                  <input 
                    required 
                    type="text" 
                    value={editingPunto.nombre}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-[#FFBF00] transition-all" 
                    onChange={e => setEditingPunto({...editingPunto, nombre: e.target.value})} 
                  />
                </div>

                <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#FFBF00] hover:text-[#1A1A1A] transition-all">
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        )}


      {/* MODAL DE REGISTRO */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-[#1A1A1A] p-6 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="text-[#FFBF00]" /> Confirmar Ubicación
              </h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="hover:rotate-90 transition-transform p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form className="p-8 space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.from('puntos_monitoreo').insert([newPunto]);
              if (!error) {
                setShowRegisterModal(false);
                setPuntos([...puntos, { ...newPunto, id: Date.now() }]);
              }
            }}>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Coordenadas Capturadas</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase">Latitud</label>
                    <span className="text-sm font-mono font-bold text-[#FFBF00]">{newPunto.lat?.toFixed(6)}</span>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase">Longitud</label>
                    <span className="text-sm font-mono font-bold text-[#FFBF00]">{newPunto.lng?.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Nombre del Sector/Panal</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: Lote A - Sector Norte" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-[#FFBF00] transition-all" 
                  onChange={e => setNewPunto({...newPunto, nombre: e.target.value})} 
                />
              </div>

              <button type="submit" className="w-full bg-[#FFBF00] text-[#1A1A1A] py-4 rounded-2xl font-bold shadow-lg shadow-yellow-100 hover:scale-[1.02] active:scale-95 transition-all">
                Registrar Ubicación
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ORDEN */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95">
            
            {/* LADO IZQUIERDO: FORMULARIO */}
            <div className="flex-1 p-10 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#1A1A1A]">Nueva orden</h2>
                  <p className="text-sm text-gray-500 mt-1">Completa los datos para proponer la ubicación de las colmenas.</p>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Nombre del Cliente / Fundo
                </label>
                <input 
                  type="text" 
                  placeholder="Escribe el nombre del cliente..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-[#FFBF00] transition-all font-medium"
                  value={newOrder.cliente}
                  onChange={(e) => setNewOrder({...newOrder, cliente: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cantidad panales</label>
                    <input type="number" value={newOrder.cantidadPanales} className="w-full bg-gray-50 border rounded-xl p-4 font-bold" 
                      onChange={(e) => setNewOrder({...newOrder, cantidadPanales: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Duración (meses)</label>
                    <input type="number" value={newOrder.duracion} className="w-full bg-gray-50 border rounded-xl p-4 font-bold" 
                      onChange={(e) => setNewOrder({...newOrder, duracion: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Latitud</label>
                    <input type="number" step="any" value={newOrder.lat} placeholder="-12.0463" className="w-full bg-gray-50 border rounded-xl p-4 font-mono text-sm"
                      onChange={(e) => setNewOrder({...newOrder, lat: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Longitud</label>
                    <input type="number" step="any" value={newOrder.lng} placeholder="-77.0427" className="w-full bg-gray-50 border rounded-xl p-4 font-mono text-sm"
                      onChange={(e) => setNewOrder({...newOrder, lng: e.target.value})} />
                </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notas internas</label>
                  <textarea placeholder="Condiciones especiales, accesibilidad al fundo..." className="w-full bg-gray-50 border rounded-xl p-4 h-24 resize-none"
                    onChange={(e) => setFormData({...formData, notas: e.target.value})} />
                </div>
              </div>
            </div>

            {/* LADO DERECHO: MINI MAPA */}
            <div className="w-full md:w-[480px] bg-gray-100 relative">
              <MapContainer center={PERU_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* AUTO-ENFOQUE AL ESCRIBIR COORDENADAS */}
                <MapViewUpdater center={[parseFloat(newOrder.lat), parseFloat(newOrder.lng)]} />

                {/* ACTUALIZA COORDENADAS AL HACER CLIC EN MINI MAPA */}
                <useMapEvents click={(e) => setNewOrder({...newOrder, lat: e.latlng.lat.toString(), lng: e.latlng.lng.toString()})} />

                {newOrder.lat && newOrder.lng && (
                  <Marker position={[parseFloat(newOrder.lat), parseFloat(newOrder.lng)]} icon={userLocationIcon} />
                )}
              </MapContainer>
              
              <div className="absolute bottom-10 left-10 right-10 z-[1000] flex flex-col gap-3">
                 <button 
                  onClick={async () => {
                    // 1. Validaciones básicas
                    if (!newOrder.cliente || !newOrder.lat || !newOrder.lng) {
                      alert("⚠️ Por favor completa el nombre del cliente y la ubicación en el mapa.");
                      return;
                    }

                    // 2. Preparamos el objeto para Supabase
                    // Usamos el nombre del cliente como nombre del punto para que salga en la lista
                    const puntoAGuardar = {
                      nombre: newOrder.cliente,
                      user_id: currentUser?.id,
                      lat: parseFloat(newOrder.lat),
                      lng: parseFloat(newOrder.lng),
                      temp: 0, // Valores iniciales para IoT
                      hum: 0,
                      detalles: `Pedido: ${newOrder.cantidadPanales} panales por ${newOrder.duracion} meses.`
                    };

                    try {
                      const { data, error } = await supabase
                        .from('puntos_monitoreo')
                        .insert([puntoAGuardar])
                        .select();

                      if (error) throw error;

                      // 3. Actualizamos el estado local para que aparezca en la derecha sin recargar
                      if (data) {
                        setPuntos([...puntos, data[0]]);
                        alert(`✅ Orden de ${newOrder.cliente} registrada y ubicada en el mapa.`);
                        setIsOrderModalOpen(false); // Cerramos el modal
                        // Limpiamos el formulario
                        setNewOrder({ cliente: '', cantidadPanales: 10, duracion: 12, lat: '', lng: '', notas: '' });
                      }
                    } catch (error: any) {
                      alert("Error al guardar en base de datos: " + error.message);
                    }
                    /* Aquí puedes añadir el insert a Supabase */
                    setIsOrderModalOpen(false);
                    alert("Orden registrada con éxito.");
                  }}
                  className="w-full bg-[#FFBF00] text-[#1A1A1A] py-5 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-transform"
                >
                  Registrar orden
                </button>
                <button onClick={() => setIsOrderModalOpen(false)} className="w-full bg-white/90 backdrop-blur-md text-gray-600 py-3 rounded-xl font-bold text-sm">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  //////////////////////////////VISTA CONTRATOS ////////////////////////////

if (activeTab === 'contracts') {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          html, body { 
            background: white !important; 
            background-image: none !important;
          }
          body * { visibility: hidden !important; }
          #contrato-oficial, #contrato-oficial * { visibility: visible !important; }

          #contrato-oficial {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm 20mm !important; /* Reducido un poco para ganar espacio */
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
            overflow: hidden !important; /* Evita que se cree la 2da hoja */
          }

          .print-footer-fixed {
            position: absolute !important;
            bottom: 12mm !important; /* Pegado un poquito más al borde inferior */
            left: 20mm !important;
            right: 20mm !important;
            display: block !important;
          }
        }
      `}} />

      {/* --- HOJA DE CONTRATO (AJUSTE DE ESPACIOS) --- */}
      <div id="contrato-oficial" className="hidden print:flex bg-white text-black font-serif relative">
        
        {/* ENCABEZADO - Compactado ligeramente */}
        <div className="flex justify-between items-end border-b-4 border-yellow-500 pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-yellow-600 italic leading-none">BeePoliniza</h1>
            <p className="text-lg font-black text-black tracking-tighter">PRO-AI ECOSYSTEM</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans mt-1 font-bold">Certificado de Servicio Digital</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-tight">Contrato de Polinización</h2>
            <p className="text-xs text-gray-500 font-sans font-bold">ID: #{realContracts[0]?.id || '15'} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* PARTES INTERESADAS - Espaciado mb-8 en lugar de mb-12 */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-5 rounded-2xl border-l-8 border-yellow-500 shadow-sm">
            <h3 className="text-[9px] font-bold text-yellow-600 uppercase mb-1 font-sans tracking-widest">Prestador (Apicultor)</h3>
            <p className="text-xl font-bold leading-tight">
              {realContracts[0]?.apicultor?.name || 'Servicio de Apicultura Profesional'}
            </p>
            <p className="text-xs text-gray-500 mt-1 italic">Identidad verificada vía Smart Contract</p>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border-l-8 border-gray-300 shadow-sm">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase mb-1 font-sans tracking-widest">Cliente (Agricultor)</h3>
            <p className="text-xl font-bold leading-tight">FST Negocios - Yahaira</p>
            <p className="text-xs text-gray-500 mt-1 uppercase">Magdalena del Mar, Lima</p>
          </div>
        </div>

        {/* UBICACIÓN - mb-8 */}
        <div className="mb-8 p-5 border-2 border-gray-100 bg-gray-50/50 rounded-2xl flex items-center gap-5">
          <div className="bg-yellow-500 p-3 rounded-xl text-white">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-[9px] font-bold text-gray-400 uppercase font-sans tracking-widest mb-0.5">Punto de Entrega Georeferenciado</h3>
            <p className="text-base font-bold font-mono text-gray-800">{realContracts[0]?.location || 'Ubicación GPS: -12.0908, -77.0567'}</p>
          </div>
        </div>

        {/* CLÁUSULAS - Ajustado flex-grow para no desbordar */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 mb-8 shadow-md flex-grow max-h-[350px]">
          <h3 className="text-xs font-bold uppercase mb-4 font-sans text-gray-400 tracking-[0.3em] border-b pb-3">Cláusulas del Acuerdo Digital</h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-gray-800">
                <span className="font-bold">Disponibilidad biológica:</span> Entrega de colmenas con estándar optimizado para la polinización dirigida.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-gray-800">
                <span className="font-bold">Garantía IoT:</span> Monitoreo activo 24/7 de la salud y eficiencia de las colonias.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 flex justify-between items-center border-t-2 border-dashed border-gray-200">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado de la Operación</p>
              <span className="text-2xl font-black text-green-600">TRANSACCIÓN COMPLETA</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Certificación IA</p>
              <p className="text-xs font-bold font-mono bg-black text-white px-3 py-1.5 rounded-lg">Sello: BP-{realContracts[0]?.id || '15'}-AI</p>
            </div>
          </div>
        </div>

        {/* FIRMAS - mb-20 para dejar espacio al footer sin saltar página */}
        <div className="flex justify-between px-10 mb-20">
          <div className="text-center w-64">
            <div className="h-20 flex items-end justify-center border-b-2 border-black mb-3 pb-1">
              {(selectedContractForSign?.firma_apicultor || realContracts[0]?.firma_apicultor) && (
                <img 
                  src={selectedContractForSign?.firma_apicultor || realContracts[0]?.firma_apicultor} 
                  alt="Firma Prestador" 
                  className="max-h-full mix-blend-multiply scale-110" 
                />
              )}
            </div>
            <p className="text-[10px] font-bold uppercase font-sans tracking-widest">Firma del Prestador</p>
          </div>

          <div className="text-center w-64">
            <div className="h-20 flex items-end justify-center border-b-2 border-black mb-3 pb-1">
              {/* CORRECCIÓN: Buscamos específicamente en el contrato que se está visualizando */}
              {(selectedContractForSign?.firma_agricultor || realContracts.find(c => c.id === selectedContractForSign?.id)?.firma_agricultor) ? (
                <img 
                  src={selectedContractForSign?.firma_agricultor || realContracts.find(c => c.id === selectedContractForSign?.id)?.firma_agricultor} 
                  alt="Firma Cliente" 
                  className="max-h-full mix-blend-multiply scale-110" 
                />
              ) : (
                <span className="text-gray-300 text-[10px] italic mb-2 block">Esperando firma digital...</span>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase font-sans tracking-widest">Firma del Cliente</p>
          </div>
        </div>

        {/* FOOTER - Ahora encaja en la hoja A4 */}
        <div className="print-footer-fixed hidden print:block border-t-4 border-yellow-500">
          <div className="bg-[#1A1A1A] p-5 rounded-xl flex justify-between items-center text-white">
            <p className="text-[9px] font-sans opacity-80 font-bold uppercase tracking-widest">
              © 2026 BeePoliniza Pro-AI · Innovación Sostenible
            </p>
            <div className="text-[9px] font-bold uppercase tracking-tighter text-yellow-500">
              Beetrack Live IoT Ecosystem • Lima, Perú
            </div>
          </div>
        </div>
      </div>


      {/* --- VISTA NORMAL DEL DASHBOARD (PRINT:HIDDEN) --- */}
      <div className="print:hidden">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Mis Contratos Digitales</h2>
          <p className="text-gray-500">Gestión de acuerdos legales y certificados de servicio.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre de apiario..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFBF00] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-[#FFBF00]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Aceptado">Por Pagar</option>
            <option value="Pagado">Pagados</option>
          </select>
        </div>

        <div className="space-y-3">
          {realContracts
            .filter(c => {
              const cumpleEstado = statusFilter === "Todos" || c.status === statusFilter;
              
              // Buscamos en el nombre del Apicultor O en el campo partner (apiario)
              const nombreApicultor = c.apicultor?.name?.toLowerCase() || "";
              const nombrePartner = c.partner?.toLowerCase() || "";
              const busqueda = searchTerm.toLowerCase();
              
              const cumpleBusqueda = nombreApicultor.includes(busqueda) || nombrePartner.includes(busqueda);

              return cumpleEstado && cumpleBusqueda;
            })
            .map((contract) => (
              <div key={contract.id} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all group">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${
                    contract.status === 'Pendiente' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'
                  }`}>
                    <FileText size={28} />
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <h4 className="font-bold text-base text-[#1A1A1A] truncate">
                      {contract.apicultor?.name || contract.partner}
                    </h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{contract.apicultor?.name ? contract.partner : "Servicio BeePoliniza"} • ID: #{contract.id} • {new Date(contract.date).toLocaleDateString()}</p>
                  </div>

                  <div className="hidden lg:flex items-center gap-2 w-[220px] px-4 border-l border-gray-50">
                    <MapPin size={14} className="text-blue-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 truncate">{contract.location || 'Sin ubicación'}</span>
                  </div>

                  <div className="w-[100px] text-center border-l border-gray-50">
                    <span className="block text-[9px] font-black text-gray-300 uppercase tracking-widest">Monto</span>
                    <span className="font-bold text-lg text-[#1A1A1A]">S/ {contract.total}</span>
                  </div>

                  <div className="w-[180px] flex justify-end shrink-0">
                    {contract.status === 'Pendiente' && (
                      <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-[10px] font-bold uppercase">Pendiente</span>
                    )}

                    {contract.status === 'Aceptado' && (
                  <button 
                    onClick={async () => {
                      setSelectedContractForSign(contract); 
                      setIsSigning(true);

                      window.open('https://mpago.la/2QJ1sVy', '_blank');
                    const { error } = await supabase
                      .from('contratos')
                      .update({ status: 'Pagado' })
                      .eq('id', contract.id);

                    if (error) {
                      console.error("Error al actualizar pago:", error);
                    }
                    }}
                      className="px-5 py-2.5 bg-[#FFBF00] text-[#1A1A1A] rounded-xl text-[10px] font-bold shadow-lg hover:scale-105 transition-all"
                    >
                      Pagar Ahora
                    </button>
                )}


                    {contract.status === 'Pagado' && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1">
                          <CheckCircle size={12} /> Pagado
                        </span>
                        <button 
                          onClick={() => setTimeout(() => window.print(), 200)}
                          className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#1A1A1A] hover:text-white transition-all border border-gray-100"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {isSigning && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-[#1A1A1A] p-6 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle className="text-[#FFBF00]" /> Firma del Agricultor
              </h3>
              <button onClick={() => setIsSigning(false)} className="hover:text-[#FFBF00] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 mb-6 overflow-hidden">
                {/* IMPORTANTE: La ref={sigCanvas} es la que evita el error */}
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor='black'
                  canvasProps={{
                    width: typeof window !== 'undefined' && window.innerWidth < 768 ? 280 : 400, 
                    height: 200, 
                    className: 'sigCanvas mx-auto'
                  }}
                />
              </div>
              <button 
                onClick={() => {
                  if (sigCanvas.current) {
                    // 1. Cambiamos getTrimmedCanvas() por getCanvas() para evitar el error de "import_trim_canvas"
                    const canvas = sigCanvas.current.getCanvas(); 
                    const dataUrl = canvas.toDataURL('image/png');
                    handleSaveAgricultorSignature(dataUrl);
                  }
                }}
                className="w-full bg-[#FFBF00] text-[#1A1A1A] py-5 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all"
              >
                Confirmar y Finalizar Contrato
              </button>

              <button 
                onClick={() => sigCanvas.current.clear()} 
                className="w-full mt-2 text-gray-400 text-xs font-bold uppercase"
              >
                Limpiar trazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  

  //////////////////////////////VISTA METRICAS////////////////////////////
 
  if (activeTab === 'metrics') {
    // --- LÓGICA DE DATOS REALES (DINÁMICOS) ---
    const totalHectareasReales = solicitudes ? solicitudes.reduce((acc: number, curr: any) => acc + (Number(curr.hectareas) || 0), 0) : 0;
    const totalContratos = realContracts ? realContracts.length : 0;
    const contratosPagados = realContracts ? realContracts.filter((c: any) => c.status === 'Pagado').length : 0;
    const porcentajeOcupacion = totalContratos > 0 ? Math.round((contratosPagados / totalContratos) * 100) : 0;
    const roiCalculado = totalContratos > 0 ? (2.4 + (contratosPagados * 0.5)).toFixed(1) : "5.8";

    // ✅ LÓGICA DINÁMICA PARA EL GRÁFICO DE LÍNEAS (PUNTOS DE MONITOREO)
    const tienePuntos = puntos && puntos.length > 0;
    const factorActividad = tienePuntos ? 1.2 : 1.0; 
    const dataActividadReal = [
        { hora: '06am', nivel: Math.round(25 * factorActividad) },
        { hora: '09am', nivel: Math.round(55 * factorActividad) },
        { hora: '12pm', nivel: Math.round(85 * factorActividad) },
        { hora: '03pm', nivel: Math.round(75 * factorActividad) },
        { hora: '06pm', nivel: Math.round(35 * factorActividad) },
        { hora: '09pm', nivel: Math.round(10 * factorActividad) }
    ];

    // ✅ LÓGICA DE DATOS PARA EL GRÁFICO DE BARRAS (Nombres reales)
    const chartBarData = realContracts && realContracts.length > 0
        ? realContracts.slice(0, 5).map((contract: any, index: number) => ({
            name: contract.partner.length > 10 ? contract.partner.substring(0, 10) + '...' : contract.partner,
            fullName: contract.partner, 
            eficiencia: contract.status === 'Pagado' ? 95 : 75,
            fill: index % 2 === 0 ? '#FFBF00' : '#1A1A1A'
        }))
        : [{ name: 'Sin Datos', eficiencia: 0, fullName: 'Sin Datos', fill: '#EEE' }];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {/* ✅ ESTILOS GLOBALES PARA ELIMINAR BORDES NEGROS */}
            <style dangerouslySetInnerHTML={{ __html: `
                .recharts-bar-rect, .recharts-bar-rectangle, .recharts-rectangle, 
                .recharts-cartesian-axis-tick-value, .recharts-wrapper, .recharts-surface {
                    outline: none !important;
                    box-shadow: none !important;
                    -webkit-tap-highlight-color: transparent;
                }
            `}} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
                <div>
                    <h2 className="text-4xl font-bold">Rendimiento Operativo</h2>
                    <p className="text-gray-500 mt-2">Análisis en tiempo real basado en IoT y contratos activos.</p>
                </div>
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-2xl text-xs font-bold border border-green-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    Sincronizado con BeeTrack
                </div>
            </div>
            
            {/* TARJETAS SUPERIORES (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-4">
                        <Zap size={20} className="text-[#FFBF00]" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eficiencia Promedio</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2">92%</p>
                    <span className="text-xs text-green-500 font-bold">Óptimo</span>
                </div>

                <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBF00]/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-yellow-500">Ocupación Actual</span>
                    <p className="text-4xl font-bold text-white mt-2">{contratosPagados} / {totalContratos}</p>
                    <p className="text-[10px] opacity-60 mt-2 italic">Contratos activos hoy</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                        <MapIcon size={20} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hectáreas Cubiertas</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2">{totalHectareasReales} ha</p>
                    <span className="text-xs text-gray-400">Datos de solicitudes</span>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ROI Estimado</span>
                    <p className="text-4xl font-bold text-[#1A1A1A] mt-2">{roiCalculado}x</p>
                    <span className="text-xs text-green-600 font-bold">Inversión optimizada</span>
                </div>
            </div>

            {/* GRÁFICOS DETALLADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* GRÁFICO 1: INTENSIDAD IOT (IZQUIERDA) */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-[450px]">
                    <h4 className="font-bold text-xl mb-10 flex items-center gap-2">
                        <Activity className="text-green-500" size={20} /> Intensidad de Polinización (IoT)
                    </h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={dataActividadReal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNivel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                cursor={{ stroke: '#22c55e', strokeWidth: 2 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl border border-green-500/30">
                                                <p className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">Flujo BeeTrack</p>
                                                <p className="text-xl font-black">{payload[0].value}% <span className="text-[10px] font-normal opacity-60">Actividad</span></p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                wrapperStyle={{ outline: 'none' }}
                            />
                            <Area type="monotone" dataKey="nivel" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorNivel)" style={{ outline: 'none' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-gray-400 text-center mt-4 italic">
                        {tienePuntos ? `* Datos reales de tus ${puntos.length} sensores BeeTrack.` : "* Proyección estimada BeeAI."}
                    </p>
                </div>

                {/* GRÁFICO 2: COMPARATIVA APICULTORES (DERECHA) */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-[450px]">
                    <h4 className="font-bold text-xl mb-10 flex items-center gap-2">
                        <BarChart3 className="text-[#FFBF00]" size={20} /> Eficiencia por Apicultor (%)
                    </h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartBarData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }} dy={10} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                cursor={{ fill: '#F9FAFB' }} 
                                contentStyle={{ border: 'none', backgroundColor: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#1A1A1A] text-white p-5 rounded-3xl shadow-2xl border-2 border-yellow-500/20">
                                                <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-1">Proveedor</p>
                                                <p className="text-base font-bold mb-3">{payload[0].payload.fullName}</p>
                                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                                                    <Zap size={18} className="text-yellow-500" />
                                                    <p className="text-xl font-black">{payload[0].value}% <span className="text-xs font-normal opacity-60">Eficiencia</span></p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                wrapperStyle={{ outline: 'none' }}
                            />
                            <Bar dataKey="eficiencia" radius={[12, 12, 12, 12]} barSize={45} style={{ outline: 'none' }}>
                                {chartBarData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none' }} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


  //////////////////////////////VISTA AYUDA////////////////////////////

  if (activeTab === 'help') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFBF00] mx-auto mb-4">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-4xl font-bold">Centro de Ayuda y Soporte</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Todo lo que necesitas saber para maximizar el potencial de polinización en tus campos con BeePoliniza Pro-AI.</p>
        </div>

        {/* Guía Visual Paso a Paso */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <BookOpen className="text-[#FFBF00]" size={20} /> Guía Rápida de Inicio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: ShoppingBag, title: "Busca", text: "Encuentra apiarios especializados." },
              { icon: Zap, title: "Analiza", text: "Compara scores de eficiencia IA." },
              { icon: ShieldCheck, title: "Asegura", text: "Contrata con respaldo digital." },
              { icon: Map, title: "Monitorea", text: "Sigue tus colmenas vía IoT." }
            ].map((step, idx) => (
              <div key={idx} className="relative text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#1A1A1A] mx-auto group-hover:bg-[#FFBF00] transition-colors">
                  <step.icon size={20} />
                </div>
                <p className="font-bold text-sm uppercase tracking-wider">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.text}</p>
                {idx < 3 && <ArrowRight size={16} className="hidden md:block absolute top-6 -right-4 text-gray-200" />}
              </div>
            ))}
          </div>
        </section>

        {/* Acordeón de FAQs */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="text-[#FFBF00]" size={20} /> Preguntas Frecuentes
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-sm">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-[#1A1A1A]">{faq.q}</span>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-gray-50 mb-4"></div>
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contacto Directo */}
        <div className="bg-[#1A1A1A] rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-full hexagon-pattern opacity-10"></div>
          <div className="z-10">
            <h4 className="text-xl font-bold mb-2">¿Necesitas asistencia personalizada?</h4>
            <p className="text-sm text-gray-400">Nuestros expertos en agrotecnología están listos para resolver tus dudas. Haz clic en el botón de WhatsApp y conversa con nosotros ahora mismo.</p>
          </div>
        </div>

        {/* Botón Flotante de WhatsApp */}
        <a 
          href="https://wa.me/51900000000?text=Hola%20BeePoliniza,%20soy%20Maria Bernilla.%20Necesito%20ayuda%20con%20mi%20servicio%20de%20polinización." 
          target="_blank" 
          className="fixed bottom-12 right-8 z-[900] animate-bounce rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
          rel="noopener noreferrer" >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
        {/* Icono de WhatsApp (puedes usar uno de Lucide si lo tienes importado) */}
              <img src="whatsapp.png" alt="WhatsApp"
               className="w-14 h-14 object-contain" // w-8 y h-8 definen el tamaño (32px). object-contain asegura que no se deforme.
              />
          {/* Etiqueta que aparece al pasar el mouse */}
          <span className="absolute right-full mr-4 bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            ¿Necesitas ayuda? Chatea con nosotros
          </span>
        </a>
      </div>
    );
  }
};

export default FarmerView;

