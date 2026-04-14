import React from 'react';
// Importar componentes de Swiper React
import { Swiper, SwiperSlide } from 'swiper/react';
// Importar módulos necesarios de Swiper
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Importar estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade'; // Para un efecto de transición suave

interface ApiarioCarouselProps {
  images: string[];
  className?: string;
}

const ApiarioCarousel: React.FC<ApiarioCarouselProps> = ({ images, className = "" }) => {
  // Si no hay imágenes, no mostramos nada o una imagen por defecto
  const cleanImages = React.useMemo(() => {
    if (!images || !Array.isArray(images)) return [];
    
    return images.flatMap(img => {
      if (typeof img === 'string') {
        // Si el string contiene una coma, lo picamos en partes
        return img.includes(',') ? img.split(',') : img;
      }
      return img;
    })
    .map(img => img.trim().replace(/^"|"$/g, '')) // Quita espacios y comillas extras
    .filter(img => img.startsWith('http')); // Solo deja lo que sea una URL válida
  }, [images]);

  if (cleanImages.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-[10px] ${className}`}>
        SIN FOTOS DISPONIBLES
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <Swiper
        // Configuración del Carrusel
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        loop={true}
        autoplay={{ delay: 3000 }}
        navigation
        pagination={{ clickable: true }}
        className="h-full w-full"
      >
        {images.map((url, index) => (
          <SwiperSlide key={index}>
            <img 
              src={url} 
              alt={`Apiario ${index + 1}`} 
              className="w-full h-full object-cover" 
              /* 👇 Esto evita que se vea texto si la imagen tarda en cargar */
              style={{ display: 'block' }} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
     
      {/* Estilos personalizados para los controles de Swiper (Tailwind) */}
      <style>{`
        .swiper-button-next, .swiper-button-prev { color: white !important; transform: scale(0.5); }
        .swiper-pagination-bullet-active { background: #FFBF00 !important; }
      `}</style>
    </div>
  );
};

export default ApiarioCarousel;