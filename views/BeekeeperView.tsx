import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Bell, 
  Heart, 
  TrendingUp, 
  Shield, 
  Activity, 
  Info, 
  Check,
  Upload,
  MapPin, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  FileText, 
  X,
  Map,
  Thermometer,
  Droplets, 
  Settings,
  Download,
  AlertTriangle,
  Zap, 
  Menu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import 'leaflet/dist/leaflet.css'; // MUEVE ESTA LÍNEA ARRIBA
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HIVES_MOCK, CONTRACTS } from '../constants';
import SignatureCanvas from 'react-signature-canvas'; // Asegúrate de tenerlo instalado
import { supabase } from '@/supabaseClient';


const incomeData = [
  { month: 'Ene', income: 1200 },
  { month: 'Feb', income: 1500 },
  { month: 'Mar', income: 2800 },
  { month: 'Abr', income: 3200 },
  { month: 'May', income: 2400 },
  { month: 'Jun', income: 2100 },
];

const healthTrend = [
  { day: 'Lun', health: 94 },
  { day: 'Mar', health: 92 },
  { day: 'Mie', health: 95 },
  { day: 'Jue', health: 96 },
  { day: 'Vie', health: 94 },
  { day: 'Sab', health: 97 },
  { day: 'Dom', health: 96 },
];

const SignatureModal = ({ isOpen, onClose, onSave, title }: any) => {
    const sigPad = React.useRef<any>(null);
    if (!isOpen) return null;

    const ejecutarFirma = () => {
        if (sigPad.current) {
            if (sigPad.current.isEmpty()) {
                alert("Por favor, dibuja tu firma antes de confirmar.");
                return;
            }

            try {
            const canvas = sigPad.current.getCanvas();
            const dataURL = canvas.toDataURL('image/png');
            
            console.log("Imagen capturada con éxito!");

            onSave(dataURL); 
        } catch (error) {
            console.error("Error al capturar la firma:", error);
            alert("Hubo un problema al procesar la firma. Inténtalo de nuevo.");
        }
      } else {
        console.error("La referencia sigPad es nula");
      }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A]">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                </div>
                
                <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
                    <SignatureCanvas 
                      ref={sigPad}
                      penColor='black'
                      canvasProps={{
                          width: typeof window !== 'undefined' && window.innerWidth < 768 ? 280 : 350, 
                          height: 200, 
                          className: 'sigCanvas mx-auto'
                      }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        type="button"
                        onClick={() => sigPad.current.clear()} 
                        className="py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                    >
                        Limpiar
                    </button>
                    <button 
                        type="button"
                        onClick={ejecutarFirma}
                        className="bg-[#FFBF00] text-[#1A1A1A] py-4 rounded-2xl font-bold shadow-lg shadow-yellow-100 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Confirmar y Firmar
                    </button>
                </div>
            </div>
        </div>
    );
};


const BeekeeperView: React.FC<{ activeTab: string, setActiveTab: (t: string) => void, currentUser: any }> = ({ activeTab, setActiveTab, currentUser }) => {
  const [negociacionesDB, setNegociacionesDB] = useState<any[]>([]);
  const [puntos, setPuntos] = useState<any[]>([]);
  const [marketOffers, setMarketOffers] = useState<any[]>([]); // Estado local para evitar error de 'filter'

  const [editingOffer, setEditingOffer] = useState<any>(null); // Nuevo estado para editar
  const [showEditOfferModal, setShowEditOfferModal] = useState(false); // Nuevo estado para modal

  const mapRef = useRef<L.Map | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApiario, setSelectedApiario] = useState<any>(null);
  const [appliedDemands, setAppliedDemands] = useState<number[]>([]);
  const [fileCount, setFileCount] = useState(0);

  const handlePostulate = async (id: string | number) => {
    try {
        // 1. Aquí insertamos la postulación en la base de datos
        const { error } = await supabase
            .from('postulaciones_demandas')
            .insert([
                { 
                    demanda_id: id,
                    apicultor_id: '00000000-0000-0000-0000-000000000000', // Aquí luego usaremos el ID real del usuario
                    mensaje_postulacion: "Deseo cubrir esta demanda con mis colmenas verificadas."
                }
            ]);

        if (error) throw error;

        // 2. Actualizamos el estado visual (esto ya lo tenías en tu lógica de appliedDemands)
        setAppliedDemands(prev => [...prev, id.toString()]);
        
        alert("✅ ¡Postulación enviada con éxito! El agricultor se pondrá en contacto contigo.");

    } catch (err) {
        alert("Error al postular: " + err.message);
    }
};

///////////////////////menú dashboard//////////////////////////////
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

    // 2. AQUÍ LAS FUNCIONES DE MANEJO
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []) as File[];
      if (selectedFiles.length + newFiles.length > 5) { alert("⚠️ Máximo 5 fotos."); return; }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
  };

    ///////////////////////////vista negociaciones////////////////////////////////////
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [currentContratoId, setCurrentContratoId] = useState<number | null>(null);

  
    const handleSaveSignature = async (signatureDataUrl: string) => {
    // 1. Verificación inicial (se mantiene igual)
    if (!currentContratoId) {
        alert("Error: No se seleccionó un contrato válido para firmar.");
        return;
    }

    try {
        // --- LÓGICA DE COMISIÓN (ADICIONAL) ---
        // Buscamos el contrato actual para saber el monto. 
        // Si por algo falla la red aquí, le ponemos 0 a la comisión para que el flujo de la firma SIGA funcionando.
        const { data: contratoData } = await supabase
            .from('contratos')
            .select('total')
            .eq('id', currentContratoId)
            .single();

        const montoTotal = Number(contratoData?.total || 0);
        const comisionCalculada = montoTotal * 0.10; 

        // --- ACTUALIZACIÓN (MANTIENE TUS CAMPOS ORIGINALES) ---
        const { error } = await supabase
            .from('contratos')
            .update({ 
                status: 'Aceptado', // Mantiene tu estado
                firma_apicultor: signatureDataUrl, // Mantiene tu firma
                comision: comisionCalculada // <--- Solo añadimos este campo nuevo
            })
            .eq('id', currentContratoId);

        if (error) throw error;

        // --- ACTUALIZACIÓN DE ESTADO LOCAL (TU LÓGICA ORIGINAL) ---
        // Añadimos comisionCalculada al objeto local para que todo sea coherente
        setNegociacionesDB(prev => prev.map(d => 
            d.id === currentContratoId 
                ? { ...d, status: 'Aceptado', firma_apicultor: signatureDataUrl, comision: comisionCalculada } 
                : d
        ));

        setShowSignatureModal(false);
        alert("✅ Trato aceptado y firmado digitalmente.");

    } catch (err: any) {
        // Si algo falla, el error te avisará pero los datos no se corromperán
        console.error("Error en handleSaveSignature:", err);
        alert("Error al procesar la firma: " + err.message);
    }
};

    const handleDownloadPDF = async (contrato: any) => {
    const element = document.getElementById(`pdf-content-${contrato.id}`);
    if (!element) return;

    // 1. Mostrar temporalmente fuera de pantalla
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.left = '-10000px'; 

    // 2. Esperar a que las firmas carguen
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // 2 es suficiente para una nitidez excelente
            useCORS: true,
            backgroundColor: "#ffffff",
            width: 794,
            height: 1123,
            windowWidth: 794,
            windowHeight: 1123
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Medidas A4 en milímetros
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Certificado_BeePoliniza_${contrato.id}.pdf`);
        
    } catch (err) {
        console.error("Error capturando PDF:", err);
    } finally {
        // 3. Ocultar de nuevo
        element.style.display = 'none';
        element.style.position = 'relative';
        element.style.left = '0';
    }
};


  
  const fetchNegociaciones = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase
      .from('contratos') // o 'negociaciones', según el nombre de tu tabla
      .select(`
      *,
      agricultor:usuarios!agricultor_id(name),
      apicultor:usuarios!apicultor_id(name)
    `)
      .eq('apicultor_id', Number(currentUser.id)) 
      .order('id', { ascending: false });

  if (error) {
      console.error("Error al cargar negociaciones:", error);
  } else {
    setNegociacionesDB(data);
  }
};

    const fetchMarketOffers = async () => {
  if (!currentUser?.id) return;

  const { data, error } = await supabase
    .from('ofertas')
    .select('*')
    // Forzamos a que el ID sea comparado como número
    .eq('user_id', Number(currentUser.id)) 
    .order('id', { ascending: false });
  
  if (data) setMarketOffers(data);
};

  const DynamicOfferImage = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  React.useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), 3000);
    return () => clearInterval(interval);
  }, [images]);
  return (
    <img 
      src={images[currentIndex] || 'https://picsum.photos/seed/bee/800/600'} 
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
    />
  );
};

    useEffect(() => {
      fetchPuntos();
      fetchNegociaciones();
      fetchMarketOffers();

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          },
          (error) => {
            console.warn("GPS denegado o error, usando Lima por defecto");
            setUserLocation([-12.0959, -77.0768]);
          }
        );
      }
    }, []);

    function MapEventsHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

 ///////////////////////APIARIOS - BEETRACK//////////////////////
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [newPunto, setNewPunto] = useState({ nombre: '', lat: 0, lng: 0, detalles: '', notas: '', temp: 0, hum: 0 });
  const [editingPunto, setEditingPunto] = useState<any>(null);
  const PERU_CENTER: [number, number] = [-12.095959902097645, -77.07680942362022];
  const [position, setPosition] = useState<[number, number]>(PERU_CENTER);
  // 🪟 Estados para controlar qué ventana se ve
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchPuntos = async () => {
      if (!currentUser?.id) return;

      const { data, error } = await supabase
        .from('puntos_monitoreo')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: false });

    if (!error && data) setPuntos(data);
  };


  const handleDeleteOffer = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar esta publicación? Se quitará del Marketplace inmediatamente.")) {
      try {
        const { error } = await supabase.from('ofertas').delete().eq('id', id);
        if (error) throw error;
        
        // Actualizamos el estado local para que desaparezca de la vista al instante
        setMarketOffers(prev => prev.filter(o => o.id !== id));
        alert("✅ Publicación eliminada con éxito.");
      } catch (err: any) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

    const [newOrder, setNewOrder] = useState({
    cliente: '',
    cantidadPanales: 10,
    duracion: 12,
    lat: '', // Se llena al hacer clic en el mini mapa
    lng: '', 
    notas: '',
    temperatura: 0, 
    humedad: 0
});

const MapViewUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 1.5, // Hace el movimiento suave, no un salto brusco
      });
  }
 }, [center, map]);

  return null;
};

const MapResizer = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Si no hay GPS, forzamos vista en Lima (PERU_CENTER)
    if (!center) {
      map.setView([-12.0959, -77.0768], 13);
    } else {
      map.setView(center, map.getZoom());
    }
    
    // El truco del invalidateSize para quitar el fondo gris
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [map, center]);

  return null;
};

 const MapEvents = ({ puntos, setNewPunto, newPunto, setShowRegisterModal }: any) => {
  useMapEvents({
    click(e) {
      setNewPunto({
        ...newPunto,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
      setShowRegisterModal(true);
    },
  });
  return null;
};

// 🐝 Definición de Iconos Personalizados para el Mapa
const beeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/517/517563.png', // Icono de abeja
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const userLocationIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png', // Marcador azul de GPS
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

useEffect(() => {
    fetchPuntos();
  // 1. Centrar el mapa en Perú por defecto al arrancar
  setPosition(PERU_CENTER);

  const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);

  // 2. Pedir ubicación en tiempo real
  if ("geolocation" in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];
        
        setUserLocation(newCoords); // Guarda tu posición actual
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }
}, []);


/////////////////VISTA DASHBOARD///////////////////////

  if (activeTab === 'inicio') {
  // --- LÓGICA DE DATOS EN TIEMPO REAL ---
  const colmenasPublicadas = marketOffers.reduce((acc, curr) => acc + (Number(curr.hive_count) || 0), 0);
  const colmenasContratadas = negociacionesDB
    .filter(c => c.status === 'Pagado' || c.status === 'Aceptado')
    .reduce((acc, curr) => acc + (Number(curr.cantidad_panales) || 0), 0);
  
  const totalCapacidad = colmenasPublicadas + colmenasContratadas;
  const porcentajeOcupacion = totalCapacidad > 0 
    ? Math.round((colmenasContratadas / totalCapacidad) * 100) 
    : 0;

  const ingresosTotales = negociacionesDB.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  // --- NUEVA LÓGICA DE ALERTAS DINÁMICAS (BEETRACK IOT) ---
  // Mapeamos los puntos del mapa para generar alertas automáticas basadas en sensores
  const alertasDinamicas = puntos.slice(0, 3).map((punto) => {
    let tipo = { title: "Monitoreo Activo", color: "blue", icon: <Activity size={14} />, desc: `Sensor operativo en ${punto.nombre}` };
    
    // Alerta por Temperatura Alta
    if (punto.temperatura > 35) {
      tipo = { title: "Alerta Térmica", color: "red", icon: <AlertTriangle size={14} />, desc: `${punto.nombre}: Temp. crítica de ${punto.temperatura}°C` };
    } 
    // Alerta por Humedad Alta
    else if (punto.humedad > 80) {
      tipo = { title: "Exceso de Humedad", color: "yellow", icon: <Droplets size={14} />, desc: `${punto.nombre}: Posible lluvia o condensación.` };
    }
    // Alerta por punto nuevo o sin datos
    else if (!punto.temperatura) {
      tipo = { title: "Sincronizando...", color: "blue", icon: <Clock size={14} />, desc: `${punto.nombre}: Esperando primer reporte IoT.` };
    }

    return { ...tipo, id: punto.id };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
      <div className="space-y-2">
          <h2 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Panel de Apicultor 🐝</h2>
          <div className="flex items-center gap-3 bg-white/50 w-fit px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              BeeTrack IoT: {puntos.length} {puntos.length === 1 ? 'punto conectado' : 'puntos conectados'}
            </p>
          </div>
      </div>
      
      {/* Botón de Status BeeAI se mantiene a la derecha */}
      <div className="hidden md:flex bg-yellow-50 border border-yellow-100 p-2 px-4 rounded-2xl items-center gap-3">
          <div className="bg-[#FFBF00] p-2 rounded-xl text-white shadow-lg shadow-yellow-200">
            <Zap size={16} fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#FFBF00] uppercase tracking-widest leading-none">BeeAI Status</p>
            <p className="text-xs font-bold text-[#1A1A1A]">Sistemas Operativos</p>
          </div>
      </div>
  </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all duration-500 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 rounded-2xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse">ESTABLE</span>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase mb-1 tracking-widest">Salud Biológica</h4>
              <p className="text-5xl font-black text-[#1A1A1A]">96%</p>
              <div className="mt-6 h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div className="h-full w-[96%] bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all"></div>
              </div>
              <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-20 group-hover:-translate-y-8 transition-all duration-700 pointer-events-none">
                 <img src="https://cdn-icons-png.flaticon.com/512/517/517563.png" className="w-24 h-24" alt="bee" />
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all duration-500">
              <div className="flex justify-between items-start mb-4 text-blue-500">
                  <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Activity size={24} />
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">LIVE DATA</span>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase mb-1 tracking-widest">Ocupación</h4>
              <p className="text-5xl font-black text-[#1A1A1A]">{porcentajeOcupacion}%</p>
              <p className="text-xs text-gray-400 mt-4 font-bold uppercase">{colmenasContratadas} / {totalCapacidad} Colmenas</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-[#FFBF00] transition-all duration-500">
              <div className="flex justify-between items-start mb-4 text-green-500">
                  <div className="p-3 bg-green-50 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <TrendingUp size={24} />
                  </div>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase mb-1 tracking-widest">Ingresos Totales</h4>
              <p className="text-5xl font-black text-[#1A1A1A]">S/ {ingresosTotales.toLocaleString()}</p>
              <p className="text-xs text-green-500 font-black mt-4 flex items-center gap-1">
                <ArrowUpRight size={14} /> Ciclo activo
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-10">
                  <h4 className="font-bold text-xl text-[#1A1A1A]">Evolución Financiera</h4>
                  <select className="text-xs font-black text-[#FFBF00] bg-yellow-50 px-3 py-1 rounded-lg outline-none cursor-pointer">
                      <option>Últimos 6 meses</option>
                  </select>
              </div>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={incomeData}>
                          <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FFBF00" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#FFBF00" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold'}} />
                          <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                          <Area type="monotone" dataKey="income" stroke="#FFBF00" strokeWidth={5} fillOpacity={1} fill="url(#colorIncome)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* ALERTAS ENLAZADAS EN TIEMPO REAL CON BEETRACK */}
          <div className="bg-[#1A1A1A] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400 opacity-5 rounded-bl-[10rem] transition-all duration-700"></div>
              <h4 className="font-bold text-xl mb-8 flex items-center gap-3 relative z-10">
                  <div className="bg-[#FFBF00] p-2 rounded-xl">
                    <Bell className="text-[#1A1A1A]" size={20} fill="currentColor" />
                  </div>
                  Alertas BeeTrack IoT
              </h4>
              <div className="space-y-4 flex-grow relative z-10">
                  {alertasDinamicas.length > 0 ? (
                    alertasDinamicas.map((alert) => (
                      <div key={alert.id} className={`bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-4 hover:bg-white/10 transition-all cursor-pointer border-l-4 ${alert.color === 'red' ? 'border-l-red-500' : alert.color === 'yellow' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                          <div className={`mt-1 shrink-0 ${alert.color === 'red' ? 'text-red-500' : alert.color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}`}>
                            {alert.icon}
                          </div>
                          <div className="min-w-0">
                              <p className="text-sm font-black tracking-tight truncate">{alert.title}</p>
                              <p className="text-[11px] opacity-50 font-medium truncate">{alert.desc}</p>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center opacity-30 italic text-sm">
                       No hay eventos recientes en campo
                    </div>
                  )}
              </div>
              <button 
                onClick={() => setActiveTab('beetrack')}
                className="mt-8 bg-white/10 hover:bg-[#FFBF00] hover:text-[#1A1A1A] py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5"
              >
                Ir a Monitoreo Live
              </button>
          </div>
      </div>
    </div>
  );
}

  ///////////////////////////////NUEVA VISTA: MIS OFERTAS///////////////////////////////
  if (activeTab === 'my_offers') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-2">Mis Publicaciones</h2>
            <p className="text-gray-500">Gestiona tus ofertas activas en el Marketplace de BeePoliniza.</p>
          </div>
          <button onClick={() => { setEditingOffer(null); setIsModalOpen(true); }} className="bg-[#FFBF00] text-[#1A1A1A] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-yellow-100">
            <Plus size={20} /> Publicar Nueva
          </button>
        </div>

        {/* GRILLA DE PUBLICACIONES REALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {marketOffers.length > 0 ? (
            marketOffers.map((offer) => {
              const isStockOut = offer.hive_count <= 0; // Lógica de stock
              
              return (
                <div key={offer.id} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500 ${isStockOut ? 'opacity-80' : ''}`}>
                  <div className="relative h-56">
                    {/* CAMBIO: Carrusel dinámico en lugar de imagen estática */}
                    <DynamicOfferImage images={offer.images_urls || []} />
                    
                    {/* AÑADIDO: Etiqueta de Stock/Agotado */}
                    {isStockOut ? (
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">Agotado</div>
                    ) : (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">En Stock</div>
                    )}

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm">
                      <span className="text-xs font-black text-[#1A1A1A]">S/ {offer.price}</span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-xl text-[#1A1A1A]">{offer.provider}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{offer.crop_type}</p>
                      </div>
                      <div className={`p-2 rounded-xl ${isStockOut ? 'bg-gray-100 text-gray-400' : 'bg-yellow-50 text-[#FFBF00]'}`}>
                        <Zap size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Colmenas</p>
                        <p className={`font-bold ${isStockOut ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{offer.hive_count} Und.</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Eficiencia</p>
                        <p className="font-bold text-green-600">{offer.efficiency || 95}%</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {/* CAMBIO: Ahora este botón activa el modal con la data de la oferta */}
                      <button 
                        onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }}
                        className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold text-xs hover:bg-[#1A1A1A] hover:text-white transition-all"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="w-14 bg-red-50 text-red-500 flex items-center justify-center rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search size={32} className="text-gray-200" />
              </div>
              <h4 className="text-gray-400 font-bold uppercase tracking-widest text-sm">No tienes publicaciones activas</h4>
            </div>
          )}
        </div>

        {/* Modal Simulado */}
        {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Encabezado */}
                <div className="bg-[#1A1A1A] p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-full hexagon-pattern opacity-10"></div>
                    <h3 className="text-2xl font-bold">Publicar Nueva Oferta de Polinización</h3>
                    <p className="text-white/60 text-sm">Configura los detalles de tu servicio para los agricultores.</p>
                </div>

                {/* FORMULARIO ÚNICO - Dos Columnas */}
                <form className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto max-h-[70vh]"
                    onSubmit={async (e) => {
                        e.preventDefault();

                        const filesToUpload: File[] = selectedFiles;
                        const formData = new FormData(e.currentTarget);
                        
                        const submitButton = e.currentTarget.querySelector('button[type="submit"]');
                        if (submitButton) {
                            submitButton.disabled = true;
                            submitButton.innerHTML = 'Subiendo imágenes...';
                        }

                        let uploadedUrls: string[] = [];

                        try {
                          // --- NUEVO: OBTENER EL USUARIO AUTENTICADO ---
                          if (!currentUser?.id) {
                            throw new Error("No se encontró una sesión activa. Por favor, reingresa al sistema.");
                          }

                          // 1. Subida de imágenes
                          if (filesToUpload.length > 0) {
                              for (const file of filesToUpload) {
                                  const fileName = `apiario_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                                  const { error: uploadError } = await supabase.storage.from('apiarios').upload(`ofertas/${fileName}`, file);
                                  if (uploadError) continue;
                                  const { data: urlData } = supabase.storage.from('apiarios').getPublicUrl(`ofertas/${fileName}`);
                                  if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
                              }
                          }

                            // 2. Insertar en Base de Datos
                            const datosOferta = {
                              user_id: Number(currentUser.id),
                              provider: formData.get('apiario_name') || "Apiario Sin Nombre",
                              hive_count: Number(formData.get('hives')) || 0,
                              lat: parseFloat(formData.get('lat') as string) || 0,
                              lng: parseFloat(formData.get('lng') as string) || 0,
                              price: Number(formData.get('price')) || 0,
                              crop_type: formData.get('crop') || 'General',
                              availability_date: formData.get('date'),
                              efficiency: Number(formData.get('efficiency')) || 95,
                              status: 'Pendiente',
                              // Si hay fotos nuevas, las usamos. Si no, mantenemos las que ya tenía la oferta (si estamos editando).
                              images_urls: uploadedUrls.length > 0 ? uploadedUrls : (editingOffer?.images_urls || ['https://picsum.photos/seed/bee/800/600']),
                              sanitary_status: "Verificado y Sano",
                              logistic_capacity: `${formData.get('hives')} Colmenas listas`,
                              trust_analysis: `Análisis BeePoliniza: Este apicultor cuenta con una eficiencia del ${formData.get('efficiency')}% garantizada.`
                            };

                            // --- LÓGICA DE DECISIÓN: ¿EDITAR O INSERTAR? ---
                            if (editingOffer) {
                                // CASO EDITAR: Actualizamos el registro existente por ID
                                const { error: updateError } = await supabase
                                    .from('ofertas')
                                    .update(datosOferta)
                                    .eq('id', editingOffer.id)
                                    .eq('user_id', currentUser.id);
                                
                                if (updateError) throw updateError;
                                alert("✅ ¡Publicación actualizada con éxito!");
                            } else {
                                // CASO NUEVO: Insertamos normal
                                const { error: ofertaError } = await supabase.from('ofertas').insert([datosOferta]);
                                if (ofertaError) throw ofertaError;

                                // Solo creamos el punto de monitoreo si es una publicación NUEVA
                                await supabase.from('puntos_monitoreo').insert([{
                                    user_id: currentUser.id, // <--- Vinculamos también el punto IoT al apicultor
                                    nombre: formData.get('apiario_name'),
                                    lat: parseFloat(formData.get('lat') as string),
                                    lng: parseFloat(formData.get('lng') as string),
                                    temperatura: 0,
                                    humedad: 0,
                                    detalles: `Oferta: ${formData.get('hives')} colmenas de ${formData.get('crop')}`
                                }]);
                                
                                alert("✅ ¡Oferta publicada con éxito!");
                            }

                            setIsModalOpen(false);
                            setEditingOffer(null); // Limpiamos el estado de edición
                            window.location.reload();

                        } catch (err) {
                            alert("Error: " + err.message);
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.innerHTML = editingOffer ? 'Guardar Cambios' : 'Publicar en Marketplace';
                            }
                        }
                    }}

                    
                >
                    {/* COLUMNA IZQUIERDA: DATOS */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Información Técnica</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase">Nombre del Apiario</label>
                                <input name="apiario_name" required type="text" defaultValue={editingOffer?.provider || ""} placeholder="Ej. Apiarios del Sol" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00] transition-all" />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase">Especialidad Cultivo</label>
                                <input name="crop" required type="text" placeholder="Ej. Arándanos, Paltos" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00] transition-all" />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase">Colmenas</label>
                                <input name="hives" required type="number" defaultValue={editingOffer?.hive_count || ""} placeholder="0" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00] transition-all" />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Eficiencia %</label>
                              <div className="relative">
                                  <input 
                                      name="efficiency" 
                                      required 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      defaultValue={editingOffer?.efficiency || 95} 
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00] transition-all font-bold text-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Precio S/.</label>
                              <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">S/</span>
                                  <input 
                                      name="price" 
                                      required 
                                      type="number" 
                                      step="0.10" 
                                      defaultValue={editingOffer?.price || ""} 
                                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#FFBF00] transition-all font-bold text-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Fecha Inicio</label>
                              <input name="date" required type="date" defaultValue={editingOffer?.availability_date || ""} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#FFBF00] transition-all font-medium text-[#1A1A1A] text-sm cursor-pointer" />
                            </div>
                      </div>

                      {/* UBICACIÓN - Ahora integrada en la columna izquierda para evitar espacios vacíos */}
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 pt-4">Ubicación (BeeTrack)</h4>
                      <div className="h-48 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner relative z-0">
                          <MapContainer center={[-12.0463, -77.0427]} zoom={11} style={{ height: '100%', width: '100%' }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <MapEventsHandler onLocationSelect={(lat, lng) => {
                                  const latInp = document.getElementById('oferta-lat') as HTMLInputElement;
                                  const lngInp = document.getElementById('oferta-lng') as HTMLInputElement;
                                  if(latInp && lngInp) { latInp.value = lat.toFixed(6); lngInp.value = lng.toFixed(6); }
                              }} />
                          </MapContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="absolute left-4 top-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider z-10">Latitud</label>
                            <input 
                                id="oferta-lat" 
                                name="lat" 
                                readOnly 
                                required 
                                defaultValue={editingOffer?.lat || ""} 
                                className="w-full bg-white border border-gray-100 rounded-xl pl-4 pr-4 pt-5 pb-2 outline-none focus:border-[#FFBF00] font-mono text-xs font-bold text-[#1A1A1A] shadow-inner" 
                            />
                        </div>
                        <div className="relative">
                            <label className="absolute left-4 top-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider z-10">Longitud</label>
                            <input 
                                id="oferta-lng" 
                                name="lng" 
                                readOnly 
                                required 
                                defaultValue={editingOffer?.lng || ""} 
                                className="w-full bg-white border border-gray-100 rounded-xl pl-4 pr-4 pt-5 pb-2 outline-none focus:border-[#FFBF00] font-mono text-xs font-bold text-[#1A1A1A] shadow-inner" 
                            />
                        </div>
                    </div>
                  </div>
                            

                    {/* COLUMNA DERECHA: GALERÍA Y ACCIONES */}
                  <div className="flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-6">Galería del Apiario ({selectedFiles.length}/5)</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          {previews.map((src, index) => (
                              <div key={index} className="relative h-28 bg-gray-100 rounded-2xl overflow-hidden group border border-gray-100 shadow-sm">
                                  <img src={src} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => {
                                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                      setPreviews(prev => prev.filter((_, i) => i !== index));
                                  }} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X size={20} />
                                  </button>
                              </div>
                          ))}

                            {/* BOTÓN "AÑADIR" (Siempre visible mientras falten fotos) */}
                            {selectedFiles.length < 5 && (
                              <label className="h-28 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FFBF00] hover:bg-yellow-50 transition-all group">
                                  <input type="file" multiple accept="image/*" className="hidden" 
                                      onChange={(e) => {
                                          const newFiles = Array.from(e.target.files || []) as File[];
                                          if (selectedFiles.length + newFiles.length > 5) return alert("Máximo 5 fotos");
                                          setSelectedFiles(prev => [...prev, ...newFiles]);
                                          const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                                          setPreviews(prev => [...prev, ...newPreviews]);
                                      }} 
                                  />
                                  <Plus size={24} className="text-[#FFBF00]" />
                                  <span className="text-[10px] font-black text-gray-400 mt-1 uppercase text-center">Añadir Foto</span>
                              </label>
                            )}
                        </div>

                        {selectedFiles.length === 0 && (
                            <div className="flex-grow border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center p-6 bg-gray-50 mb-6">
                                <Upload size={32} className="text-gray-200 mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Sin fotos seleccionadas</p>
                            </div>
                        )}

                        {/* BOTONES DE ACCIÓN */}
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSelectedFiles([]);
                                    setPreviews([]);
                                }} 
                                className="py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all border border-gray-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className={`py-4 rounded-2xl font-bold transition-all ${
                                    selectedFiles.length > 0 
                                    ? 'bg-[#FFBF00] text-[#1A1A1A] shadow-lg shadow-yellow-100' 
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Publicar Ahora
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )}
      </div>
    );
  }

  /////////////////VISTA DEMANDAS - MARKETPLACE///////////////////////

  if (activeTab === 'market') {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-2">Mis Negociaciones</h2>
        <p className="text-gray-500">Gestiona las solicitudes de agricultores interesados en tus apiarios.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {negociacionesDB.length > 0 ? (
          negociacionesDB.map((contrato) => (
           <div key={contrato.id} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 hover:shadow-md transition-all">              
              {/* 1. SECCIÓN: ICONO Y NOMBRE DEL CLIENTE */}
              <div className="flex items-center gap-5 flex-1 min-w-[300px]">
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-[#FFBF00] shrink-0">
                  <FileText size={24} />
                </div>
                <div className="overflow-hidden">
                  {/* Título Principal: Apiario */}
                  <h4 className="text-lg font-black text-[#1A1A1A] truncate leading-tight">
                    {contrato.partner || "Fundo por confirmar"}
                  </h4>
                  
                  {/* Nombre del Agricultor con etiqueta sutil */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Agricultor:</span>
                    <p className="text-sm font-medium text-gray-600 truncate">
                      {contrato.agricultor?.name || "Sin nombre"}
                    </p>
                  </div>

                  {/* Metadata secundaria */}
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1 opacity-70">
                    ID: #{contrato.id} • {new Date(contrato.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 2. SECCIÓN: PRESUPUESTO */}
              <div className="flex flex-col items-center justify-center min-w-[150px] px-8 border-l border-gray-50">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Presupuesto</span>
                <span className="text-xl font-black text-[#1A1A1A]">S/ {contrato.total}</span>
              </div>

              {/* 3. SECCIÓN: ESTADO Y ACCIONES */}
              <div className="flex items-center justify-end gap-4 min-w-[280px]">
                {/* ETIQUETA DE ESTADO DINÁMICA */}
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  contrato.status === 'Pagado' ? 'bg-green-50 text-green-600' :
                  contrato.status === 'Aceptado' ? 'bg-blue-50 text-blue-600' : 
                  'bg-yellow-50 text-yellow-600'
                }`}>
                  {contrato.status}
                </div>

                {/* BOTONES SEGÚN EL ESTADO */}
                <div className="flex items-center min-w-[160px] justify-center">
                  {contrato.status === 'Pendiente' && (
                    <button 
                      onClick={() => {
                        const id = contrato.id; // Capturamos el ID directamente
                        console.log("Guardando ID para firma:", id);
                        setCurrentContratoId(id);
                        setTimeout(() => setShowSignatureModal(true), 10);

                      }}
                      className="w-full bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#FFBF00] hover:text-[#1A1A1A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-100"
                    >
                      <Check size={16} strokeWidth={3} /> Aceptar Trato
                    </button>
                  )}

                  {/* CASO B: Si está ACEPTADO, solo mostramos un mensaje de espera (el agricultor debe pagar) */}
                  {contrato.status === 'Aceptado' && (
                    <div className="flex flex-col items-center opacity-50">
                      <Clock size={16} className="text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-400 font-bold italic">Esperando pago...</p>
                    </div>
                  )}

                  {/* CASO C: Si está PAGADO, mostramos el botón para descargar el PDF */}
                  {contrato.status === 'Pagado' && (
                    <>
                      <button 
                        onClick={() => handleDownloadPDF(contrato)}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                      >
                        <Download size={16} strokeWidth={3} /> Certificado
                      </button>

                      {/* --- DISEÑO FINAL BEEPOLINIZA: CUERPO MINIMALISTA + MARCO DORADO + FOOTER NEGRO --- */}
                      <div 
                        id={`pdf-content-${contrato.id}`} 
                        className="hidden bg-white"
                        style={{
                          display: 'none', 
                          width: '794px',  // A4 exacto 96DPI
                          height: '1123px', // A4 exacto 96DPI
                          minWidth: '794px',
                          minHeight: '1123px',
                          backgroundColor: '#ffffff',
                          boxSizing: 'border-box',
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          position: 'relative',
                          overflow: 'hidden',
                          border: '12px solid #FFBF00' // Este es el MARCO AMARILLO lateral que pediste
                        }}
                      >
                          {/* CONTENIDO INTERNO */}
                          <div style={{ padding: '60px 70px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              
                              {/* ENCABEZADO */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                                  <div>
                                      <h1 style={{ fontSize: '38px', fontStyle: 'italic', fontWeight: '900', color: '#1a1a1a', margin: '0' }}>
                                          BeePoliniza <span style={{ color: '#FFBF00' }}>PRO-AI</span>
                                      </h1>
                                      <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '5px' }}>
                                          Ecosistema de Agricultura Sostenible
                                      </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                      <div style={{ border: '2px solid #1a1a1a', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                                          CERTIFICADO #00{contrato.id}
                                      </div>
                                      <p style={{ fontSize: '8px', color: '#aaa', marginTop: '6px', fontFamily: 'monospace' }}>SECURE_ID: {Math.random().toString(36).toUpperCase().substring(2,10)}</p>
                                  </div>
                              </div>

                              {/* TÍTULO */}
                              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                                  <h2 style={{ fontSize: '28px', fontWeight: '800', textTransform: 'uppercase', color: '#1a1a1a', margin: '0' }}>
                                      Certificado de Servicio Digital
                                  </h2>
                                  <div style={{ width: '50px', height: '4px', backgroundColor: '#FFBF00', margin: '15px auto 0' }}></div>
                              </div>

                              {/* DATOS DETALLADOS (Alineación Perfecta) */}
                              <div style={{ flexGrow: '1' }}>
                                  <table style={{ width: '100%', marginBottom: '40px' }}>
                                      <tr>
                                          <td style={{ verticalAlign: 'top', width: '50%' }}>
                                              <p style={{ color: '#FFBF00', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Prestador del Servicio</p>
                                              <p style={{ fontSize: '17px', fontWeight: 'bold', margin: '0' }}>{contrato.apicultor?.name || "Cargando..."}</p>
                                              <p style={{ fontSize: '11px', color: '#777', fontStyle: 'italic' }}>Identidad Protegida por Smart Contract</p>
                                          </td>
                                          <td style={{ verticalAlign: 'top', width: '50%' }}>
                                              <p style={{ color: '#FFBF00', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{contrato.agricultor?.name || contrato.partner || "Cliente"}</p>
                                              <p style={{ fontSize: '17px', fontWeight: 'bold', margin: '0' }}>{contrato.partner}</p>
                                              <p style={{ fontSize: '11px', color: '#777' }}><b>Ubicación:</b> Magdalena del Mar, Lima</p>
                                              <p style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace' }}>GPS: -12.0959, -77.0768</p>
                                          </td>
                                      </tr>
                                  </table>

                                  {/* RECUADRO DE NEGOCIACIÓN */}
                                  <div style={{ border: '1px solid #eee', padding: '25px', borderRadius: '12px', marginBottom: '40px' }}>
                                      <p style={{ color: '#aaa', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>Detalles del Contrato</p>
                                      <table style={{ width: '100%', fontSize: '14px' }}>
                                          <tr style={{ borderBottom: '1px solid #f9f9f9' }}>
                                              <td style={{ padding: '8px 0', color: '#666' }}>Fecha de Emisión:</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{new Date(contrato.date).toLocaleDateString()}</td>
                                          </tr>
                                          <tr style={{ borderBottom: '1px solid #f9f9f9' }}>
                                              <td style={{ padding: '8px 0', color: '#666' }}>Tipo de Cultivo:</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>Cerezos IoT</td>
                                          </tr>
                                          <tr>
                                              <td style={{ padding: '8px 0', color: '#666', fontWeight: 'bold' }}>Monto Total:</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '900', color: '#2ecc71', fontSize: '18px' }}>S/ {contrato.total}</td>
                                          </tr>
                                      </table>
                                  </div>

                                  {/* --- BLOQUE DE TEXTO LEGAL (INSERTAR AQUÍ) --- */}
                                  <div style={{ 
                                      marginTop: '20px', 
                                      marginBottom: '40px', 
                                      borderLeft: '4px solid #FFBF00', 
                                      paddingLeft: '20px' 
                                  }}>
                                      <p style={{ 
                                          fontSize: '11px', 
                                          color: '#1a1a1a', 
                                          fontWeight: 'bold', 
                                          textTransform: 'uppercase', 
                                          letterSpacing: '1px', 
                                          margin: '0 0 10px 0' 
                                      }}>
                                          Declaración de Conformidad Digital
                                      </p>
                                      <p style={{ 
                                          fontSize: '10.5px', 
                                          color: '#666', 
                                          textAlign: 'justify', 
                                          lineHeight: '1.6', 
                                          margin: '0 italic' 
                                      }}>
                                          Al generar este documento, ambas partes aceptan que el servicio de polinización se ha formalizado bajo los estándares de BeePoliniza Pro-AI. El apicultor se compromete al despliegue técnico monitoreado, mientras que el agricultor valida la recepción del servicio mediante el pago en garantía. Este certificado digital vincula la data recolectada por BeeTrack IoT como prueba de ejecución y eficiencia del servicio prestado.
                                      </p>
                                  </div>

                                  {/* FIRMAS (Alineadas abajo del cuerpo) */}
                              <div style={{ marginTop: '40px' }}>
                                  <table style={{ width: '100%' }}>
                                      <tr>
                                          <td style={{ width: '45%', textAlign: 'center' }}>
                                              <div style={{ height: '90px', borderBottom: '1px solid #eee', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                  {/* Firma del Apicultor */}
                                                  {contrato.firma_apicultor && (
                                                      <img 
                                                          src={contrato.firma_apicultor} 
                                                          style={{ maxHeight: '80px', mixBlendMode: 'multiply' }} 
                                                          alt="Firma Apicultor"
                                                      />
                                                  )}
                                              </div>
                                              <p style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0' }}>Firma del Apicultor</p>
                                          </td>
                                          
                                          <td style={{ width: '10%' }}></td>
                                          
                                          <td style={{ width: '45%', textAlign: 'center' }}>
                                              <div style={{ height: '90px', borderBottom: '1px solid #eee', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                  {/* ✅ LÓGICA ACTIVADA: Ahora lee la firma del agricultor guardada en la tabla */}
                                                  {contrato.firma_agricultor ? (
                                                      <img 
                                                          src={contrato.firma_agricultor} 
                                                          style={{ maxHeight: '80px', mixBlendMode: 'multiply' }} 
                                                          alt="Firma Agricultor"
                                                      />
                                                  ) : (
                                                      <span style={{ color: '#ddd', fontSize: '10px', fontStyle: 'italic' }}>
                                                          Validación Digital Pendiente
                                                      </span>
                                                  )}
                                              </div>
                                              <p style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0' }}>Firma del Agricultor</p>
                                          </td>
                                      </tr>
                                  </table>
                              </div>
                              </div>

                              {/* FOOTER NEGRO INTEGRADO (Se mantiene al final por el flexGrow) */}
                              <div style={{ 
                                  backgroundColor: '#1a1a1a', 
                                  margin: '40px -70px -60px -70px', // Esto hace que el footer choque con los bordes amarillos
                                  padding: '25px 40px',
                                  borderTop: '5px solid #FFBF00',
                                  textAlign: 'center'
                              }}>
                                  <p style={{ color: '#fff', fontSize: '9px', margin: '0', opacity: '0.8' }}>
                                      © 2026 BeePoliniza Pro-AI. Innovando por la biodiversidad y la agricultura sostenible.
                                  </p>
                                  <p style={{ color: '#FFBF00', fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '8px' }}>
                                      BEETRACK LIVE IOT ECOSYSTEM • LIMA, PERÚ
                                  </p>
                              </div>
                          </div>
                      </div>
                      



                    </>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <Search size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay negociaciones activas</p>
          </div>
        )}
      </div>
        <SignatureModal 
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
          title="Firma Digital BeePoliniza"
        />
      </div>
  );
}

  /////////////////VISTA BEETRACK - APIARIOS ///////////////////////

if (activeTab === 'beetrack') {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 h-auto md:h-[calc(100vh-160px)] flex flex-col relative animate-in fade-in duration-500">      
      {/* ENCABEZADO */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Map className="text-[#FFBF00]" /> BeeTrack Live IoT
          </h2>
          <p className="text-gray-500">Monitoreo en tiempo real de tus colmenas desplegadas en campo.</p>
        </div>
        
        <div className="flex gap-3">
          {/* Cambiamos el aviso de "Haz clic" por uno de "Estado de Red" */}
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sincronizado con Marketplace
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            GPS Activo
          </div>
        </div>
      </div>

      {/* ÁREA DE MAPA Y PANEL */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-auto lg:h-[600px] min-h-[500px]">        {/* COLUMNA MAPA */}
      {/* COLUMNA MAPA - Altura fija obligatoria */}
      <div className="lg:col-span-3 h-[400px] lg:h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative z-0">
        <MapContainer 
          key={activeTab}
          center={userLocation || [-12.0959, -77.0768]} 
          zoom={13} 
          ref={mapRef}
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }} // Importante: 100% para llenar el div
        >
          <MapResizer center={userLocation} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
                <MapResizer center={userLocation} />


            {/* Eventos y Localización */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup><b>Estás aquí</b></Popup>
              </Marker>
            )}

            {puntos.map((punto) => (
              <Marker 
                key={punto.id} 
                position={[punto.lat, punto.lng]} 
                icon={beeIcon}
              >
                {/* Ajustamos el offset y deshabilitamos el autoPan si da problemas, 
                    o lo configuramos para que fuerce el re-centrado */}
                <Popup 
                  maxWidth={280} 
                  minWidth={260}
                  offset={[0, -10]} // ✅ Empuja el popup un poco hacia arriba para que el pico coincida
                  autoPan={true}    // ✅ Fuerza al mapa a moverse para mostrar el popup centrado
                >
                  <div className="w-[260px] font-sans pb-1 relative">
                    {/* Encabezado */}
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 pr-5">
                      <h4 className="font-bold text-base text-[#1A1A1A] m-0 truncate" title={punto.nombre}>
                        {punto.nombre}
                      </h4>
                      <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 whitespace-nowrap">
                        ACTIVO
                      </span>
                    </div>

                    {/* Info Clima */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                      <div className="bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100">
                        <Thermometer size={14} className="text-[#FFBF00] mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase m-0">Temp.</p>
                        <p className="text-sm font-black m-0">{punto.temperatura || '--'}°C</p>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                        <Droplets size={14} className="text-blue-500 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase m-0">Hum.</p>
                        <p className="text-sm font-black m-0">{punto.humedad || '--'}%</p>
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-4">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Estado de Polinización</p>
                      <p className="text-[11px] m-0 italic text-gray-600 leading-relaxed">
                        "{punto.detalles || 'Sin observaciones registradas.'}"
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 border-t pt-3 mt-2">
                      <button 
                        onClick={() => { setEditingPunto(punto); setShowEditModal(true); }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Settings size={12} /> Editar
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm("¿Eliminar punto?")) {
                            const { error } = await supabase.from('puntos_monitoreo').delete().eq('id', punto.id);
                            if (!error) setPuntos(puntos.filter(p => p.id !== punto.id));
                          }
                        }}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <X size={12} /> Borrar
                      </button>
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
              {puntos.filter(p => p.user_id === currentUser?.id).length > 0 ? (
                puntos.filter(p => p.user_id === currentUser?.id).map((p) => (
                  <div key={p.id} 
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.flyTo([p.lat, p.lng], 18, {
                          duration: 1.5
                        });
                        // Opcional: mapRef.current.openPopup([p.lat, p.lng]);
                      }
                    }}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#FFBF00] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0"> {/* ✅ gap-3 y min-w-0 añadidos */}
                      <div className="flex items-center gap-3 min-w-0 flex-1"> {/* ✅ flex-1 y min-w-0 añadidos */}
                        <div className="bg-yellow-400 p-2 rounded-lg text-white group-hover:scale-110 transition-transform shrink-0"> {/* ✅ shrink-0 añadido */}
                          <MapPin size={16} />
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-[#1A1A1A] w-full" title={p.nombre}>
                            {p.nombre}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">
                            {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Etiqueta de Activo ajustada para no moverse */}
                      <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded-full shrink-0 whitespace-nowrap">
                        ACTIVO
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPunto(p); setShowEditModal(true); }}
                        className="flex-1 bg-white border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-100"
                      >
                        <Settings size={12} /> Editar
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Eliminar registro?")) {
                            const { error } = await supabase.from('puntos_monitoreo').delete().eq('id', p.id);
                            if (!error) setPuntos(puntos.filter(item => item.id !== p.id));
                          }
                        }}
                        className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-red-100"
                      >
                        <X size={12} /> Borrar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                  <MapPin size={40} className="mb-2 text-gray-300" />
                  <p className="text-xs text-gray-500 px-4">Haz clic en el mapa o en Nueva Orden.</p>
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
              
              <form className="p-8 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { error } = await supabase
                    .from('puntos_monitoreo')
                    .update({ 
                      nombre: editingPunto.nombre,
                      temperatura: editingPunto.temperatura,
                      humedad: editingPunto.humedad,
                      detalles: editingPunto.detalles 
                    })
                    .eq('id', editingPunto.id);

                  if (error) throw error;

                  // Actualizar estado local
                  setPuntos(puntos.map(p => p.id === editingPunto.id ? editingPunto : p));
                  setShowEditModal(false);
                  setEditingPunto(null);
                  alert("✅ Datos actualizados con éxito.");
                } catch (e: any) { alert(e.message); }
              }}>
                
                {/* Visualización de Coordenadas (Solo lectura para edición) */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Coordenadas (No editables)</p>
                  <span className="text-sm font-mono font-bold text-[#FFBF00]">{editingPunto.lat.toFixed(6)}, {editingPunto.lng.toFixed(6)}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Nombre del Panal</label>
                  <input required type="text" value={editingPunto.nombre} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#FFBF00]" 
                    onChange={e => setEditingPunto({...editingPunto, nombre: e.target.value})} 
                  />
                </div>

                {/* CAMPOS MANUALES PARA EL APICULTOR */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 text-blue-500">Temperatura (°C)</label>
                    <input type="number" value={editingPunto.temperatura || ''} placeholder="Ej: 25" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-400" 
                      onChange={e => setEditingPunto({...editingPunto, temperatura: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 text-blue-500">Humedad (%)</label>
                    <input type="number" value={editingPunto.humedad || ''} placeholder="Ej: 60" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-400" 
                      onChange={e => setEditingPunto({...editingPunto, humedad: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Estado de Polinización / Detalles</label>
                  <textarea value={editingPunto.detalles || ''} placeholder="Ej: Actividad alta, abejas recolectando polen..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 h-20 resize-none outline-none focus:border-[#FFBF00]" 
                    onChange={e => setEditingPunto({...editingPunto, detalles: e.target.value})} 
                  />
                </div>

                <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#FFBF00] hover:text-[#1A1A1A] transition-all mt-2">
                  Actualizar Información en Campo
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

              // --- EL CAMBIO ESTÁ AQUÍ ---
              // Creamos una copia de newPunto y le agregamos el ID del usuario logueado
              const puntoConUsuario = {
                ...newPunto,
                user_id: currentUser?.id // Esto asegura que la colmena tenga dueño
              };

              const { data, error } = await supabase
                .from('puntos_monitoreo')
                .insert([puntoConUsuario]) // Enviamos el objeto con el ID incluido
                .select(); 
              // ---------------------------

              if (!error && data) {
                setShowRegisterModal(false);
                setPuntos([...puntos, data[0]]); 
                alert("✅ Colmena registrada permanentemente");
                
                // Limpiamos el formulario (incluyendo lat/lng para que no se repitan)
                setNewPunto({ nombre: '', lat: 0, lng: 0, detalles: '', notas: '', temp: 0, hum: 0 });
              } else {
                console.error("Error completo:", error);
                alert("Error al guardar: " + (error?.message || "Error de conexión"));
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
                    onChange={(e) => setNewOrder({...newOrder, notas: e.target.value})} />
                </div>
              </div>
            </div>

            {/* LADO DERECHO: MINI MAPA */}
            <div className="w-full md:w-[480px] bg-gray-100 relative">
              <MapContainer key={activeTab} center={PERU_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
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

  /////////////////VISTA GESTIÓN - CONTRATOS///////////////////////

  if (activeTab === 'contracts') {
    // ✅ LÓGICA DINÁMICA PARA EL FLUJO DE CAJA
    const ingresosPagados = negociacionesDB
        .filter(c => c.status === 'Pagado')
        .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

    const ingresosPendientes = negociacionesDB
        .filter(c => c.status === 'Aceptado' || c.status === 'Pendiente')
        .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div>
                    <h2 className="text-4xl font-bold">Gestión de Servicios</h2>
                    <p className="text-gray-500">Seguimiento de contratos y flujo de caja real.</p>
                </div>
                
                {/* ✅ CARDS DINÁMICAS */}
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Confirmado</span>
                            <p className="font-bold text-lg text-green-600">S/ {ingresosPagados.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Por Cobrar</span>
                            <p className="font-bold text-lg text-yellow-600">S/ {ingresosPendientes.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ TABLA DINÁMICA CONECTADA A SUPABASE */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">                <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Cliente / Fundo</th>
                            <th className="px-8 py-5">Fecha de Registro</th>
                            <th className="px-8 py-5 text-center">Colmenas</th>
                            <th className="px-8 py-5">Estado</th>
                            <th className="px-8 py-5 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {negociacionesDB.length > 0 ? (
                            negociacionesDB.map((contrato) => (
                                <tr key={contrato.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-[#1A1A1A]">{contrato.partner || 'Cliente Web'}</p>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter mt-0.5">
                                            {contrato.location || 'Ubicación pendiente'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock size={14} className="text-[#FFBF00]" /> 
                                            {new Date(contrato.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="font-bold bg-gray-100 px-3 py-1 rounded-lg text-sm">
                                            {contrato.cantidad_panales || '10'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                            contrato.status === 'Pagado' ? 'bg-green-100 text-green-700' : 
                                            contrato.status === 'Aceptado' ? 'bg-blue-100 text-blue-700' : 
                                            'bg-yellow-50 text-yellow-600'
                                        }`}>
                                            {contrato.status === 'Aceptado' ? 'En Garantía' : contrato.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-[#1A1A1A]">
                                        S/ {contrato.total}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-gray-400 italic">
                                    No hay contratos registrados para seguimiento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}

  ///////////////// VISTA RENDIMIENTO (METRICS) - ACTUALIZADA ///////////////////////

  if (activeTab === 'metrics') {
    // --- LÓGICA DE DATOS REALES ---
    
    // 1. Colmenas en Oferta (Lo que tienes publicado actualmente)
    const totalColmenasEnMarketplace = (marketOffers || [])
        .reduce((acc, curr) => acc + (Number(curr.hive_count) || 0), 0);

    // 2. Cantidad de Negociaciones (ESTE ES EL CAMBIO SOLICITADO)
    const cantidadNegociaciones = (negociacionesDB || []).length;

    // 3. Datos para el gráfico de barras (Colores alternados Amarillo/Negro)
    const barDataDinamico = (marketOffers || []).map((offer, index) => ({
        name: offer.provider ? (offer.provider.length > 10 ? offer.provider.substring(0, 10) + '...' : offer.provider) : 'Apiario', 
        value: offer.hive_count || 0, 
        fill: index % 2 === 0 ? '#1A1A1A' : '#FFBF00' // Alterna Negro y Amarillo
    }));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                <div>
                    <h2 className="text-4xl font-bold mb-2">Rendimiento Operativo</h2>
                    <p className="text-gray-500">Análisis en tiempo real de tus publicaciones y despliegue en campo.</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#FFBF00] rounded-full animate-pulse"></div>
                    <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">BeeTrack Live Sync</span>
                </div>
            </div>
            
            {/* KPIs PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                
                {/* KPI: OCUPACIÓN (BASADO EN PUBLICACIONES) */}
                <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFBF00] opacity-10 rounded-bl-full transition-all group-hover:scale-125"></div>
                    <div className="flex justify-between items-start mb-4">
                         <Zap className="text-[#FFBF00]" size={20} />
                         <span className="text-[10px] font-black text-[#FFBF00] border border-[#FFBF00]/30 px-2 py-1 rounded-lg uppercase">Marketplace</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colmenas Publicadas</p>
                    <p className="text-4xl font-bold text-[#FFBF00] mt-2">{totalColmenasEnMarketplace}</p>
                    <p className="text-xs opacity-60 mt-2">En {marketOffers.length} ofertas activas</p>
                </div>

                {/* KPI: DESPLEGADAS (AHORA MUESTRA CANTIDAD DE NEGOCIACIONES) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-[#FFBF00] transition-all">
                    <div className="flex justify-between items-start mb-4">
                         <CheckCircle className="text-green-500" size={20} />
                         <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">En campo</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desplegadas</p>
                    <p className="text-4xl font-bold mt-2">{cantidadNegociaciones}</p>
                    <p className="text-xs text-gray-400 mt-2">Total de negociaciones actuales</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-[#FFBF00] transition-all">
                    <div className="flex justify-between items-start mb-4 text-blue-500">
                         <TrendingUp size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tratos Cerrados</p>
                    <p className="text-4xl font-bold mt-2">
                        {negociacionesDB.filter(n => n.status === 'Pagado').length}
                    </p>
                    <p className="text-xs text-blue-500 font-bold mt-2">Ciclo actual</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-[#FFBF00] transition-all">
                    <div className="flex justify-between items-start mb-4 text-red-500">
                         <Heart size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salud General</p>
                    <p className="text-4xl font-bold mt-2">96%</p>
                    <p className="text-xs text-green-500 font-bold mt-2">Estado: Óptimo</p>
                </div>
            </div>

            {/* SECCIÓN DE GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Gráfico de Barras - Stock por Publicación */}
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="font-bold text-xl flex items-center gap-3">
                            <Zap className="text-[#FFBF00]" size={24} /> Distribución de Stock
                        </h4>
                        <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">Colmenas por Apiario</span>
                    </div>
                    <div className="flex-grow w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={barDataDinamico.length > 0 ? barDataDinamico : [{name: 'Sin Datos', value: 0}]}
                                margin={{ top: 0, right: 10, left: -20, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold'}} 
                                    interval={0} 
                                    angle={-25} 
                                    textAnchor="end"
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                                <Tooltip 
                                    cursor={{fill: '#F9FAFB'}} 
                                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                                />
                                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                                    {barDataDinamico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Área - Salud Semanal */}
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm h-[500px] flex flex-col text-[#1A1A1A]">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="font-bold text-xl flex items-center gap-3">
                            <Heart className="text-red-500" size={24} /> Vitalidad Biológica (7d)
                        </h4>
                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold uppercase">En vivo</span>
                        </div>
                    </div>
                    <div className="flex-grow w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={healthTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} domain={[80, 100]} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                                    itemStyle={{fontWeight: 'bold', color: '#ef4444'}}
                                />
                                <Area type="monotone" dataKey="health" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorHealth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
  }
  return (
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center opacity-50">
            <Activity size={64} className="animate-pulse mb-6" />
            <h2 className="text-2xl font-bold">Vista de Proveedor</h2>
            <p>Funcionalidades exclusivas para la gestión profesional de apiarios.</p>
        </div>
    );
};

export default BeekeeperView;
