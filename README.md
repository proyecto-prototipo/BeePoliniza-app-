# 🐝 BeePoliniza Pro-AI Ecosystem
### *Optimización de Cosechas mediante Polinización de Precisión e IA*

![Status](https://img.shields.io/badge/Status-Producci%C3%B3n-brightgreen)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Supabase%20%7C%20Tailwind-blue)
![Platform](https://img.shields.io/badge/Platform-Vercel-black)

**BeePoliniza Pro-AI** es una plataforma tecnológica diseñada para revolucionar el sector agrícola en Perú. Conecta a agricultores y apicultores a través de un mercado inteligente, garantizando la calidad biológica mediante monitoreo IoT y contratos digitales con firma electrónica.

---

## 🚀 Características Principales

### 1. Torre de Control (Admin)
* **Gestión CRM:** Directorio centralizado de usuarios con roles definidos (Agricultor/Apicultor/Admin).
* **Moderación de Ofertas:** Sistema de curación proactiva para aprobar servicios que cumplan estándares técnicos.
* **Métricas de Impacto:** Seguimiento en tiempo real de hectáreas cubiertas y volumen transado.
* **Reportes Ambientales:** Generación de certificados de impacto biológico en PDF con firma digital.

### 2. Marketplace Inteligente (Agricultor)
* **Filtrado Avanzado:** Búsqueda de apiarios por tipo de cultivo, región y score de eficiencia.
* **Contratos Digitales:** Flujo completo desde la solicitud hasta el pago seguro.
* **Firma Electrónica:** Sistema integrado de firma manuscrita digital para validez legal de acuerdos.

### 3. BeeTrack Live IoT (Monitoreo)
* **Telemetría en Vivo:** Visualización en mapas interactivos de la ubicación de colmenas.
* **Sensores en Campo:** Monitoreo de temperatura, humedad y actividad biológica mediante dispositivos IoT.
* **Geolocalización:** Registro preciso de puntos de entrega y áreas de polinización activa.

---
## 📊 Metodología de Impacto Biológico

BeePoliniza Pro-AI no solo conecta usuarios, sino que cuantifica el éxito de la polinización basándose en tres pilares:

1. **Densidad de Carga:** Calculamos el número óptimo de colmenas por hectárea según el tipo de cultivo (Arándano, Palto, Almendro, etc.).
2. **Fortaleza Biológica:** Los apicultores son calificados por la salud y población de sus colmenas, asegurando una polinización activa desde el primer día.
3. **Monitoreo IoT:** Sensores BeeTrack que validan que las abejas estén en el rango de temperatura y humedad ideal para el pecoreo (vuelo de recolección).

---

## 🏛️ Arquitectura del Sistema

El ecosistema utiliza una arquitectura moderna de **Single Page Application (SPA)** conectada a un **Backend-as-a-Service (BaaS)**:

* **Real-time Engine:** Utilizamos WebSockets a través de Supabase para que el Admin vea las nuevas ofertas y el Agricultor vea el movimiento de sus colmenas al instante.
* **Security Layer:** Implementación de *Row Level Security* (RLS) para proteger la ubicación exacta de los fundos y los datos financieros de los contratos.
* **Storage:** Gestión de evidencias fotográficas de los apiarios directamente en buckets optimizados.

---

## 🌎 Visión de Futuro

BeePoliniza Pro-AI está diseñado para escalar. Nuestra hoja de ruta técnica incluye:
* **Predictive Analytics:** Usar los datos históricos de clima y polinización para predecir la fecha exacta de mayor floración.
* **Blockchain Verification:** Migrar los contratos firmados a una red descentralizada para una transparencia total e inmutable.
* **API para Fundos:** Permitir que grandes empresas agrícolas conecten sus propios sistemas de gestión con nuestra torre de control.

---

## 🤝 Contribución y Soporte

Este proyecto es liderado por **FST Negocios**. Si eres un desarrollador interesado en AgTech o un agricultor buscando digitalizar tu proceso, puedes contactarnos.

> **Nota Técnica:** Este repositorio contiene la implementación frontend y la lógica de integración con Supabase. Los esquemas de la base de datos y funciones Edge están documentados en la carpeta `/docs/backend`.

## 🛠️ Stack Tecnológico

* **Frontend:** React.js con TypeScript.
* **Estilos:** Tailwind CSS (Diseño 100% responsivo).
* **Backend & DB:** Supabase (Base de datos PostgreSQL).
* **Despliegue:** Vercel.

---

## 📝 Autor
**Yahaira Aimet Loayza Villalobos** - *FST Negocios*
