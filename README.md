# 🚀 Tech Gastro Hub (Lacarta)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-orange.svg)](https://deepmind.google/technologies/gemini/)

**Tech Gastro Hub** es una plataforma SaaS multitenant de última generación diseñada para revolucionar la experiencia gastronómica digital. Combina menús interactivos de alta fidelidad, automatización con IA y una gestión administrativa integral en una interfaz elegante con estética "Ivory Gold".

---

## ✨ Características Principales

### 📱 Experiencia del Comensal (Frontend)
- **Menú Interactivo "Page-Flip":** Una experiencia táctil y visual premium que emula una carta física.
- **Carrito Flotante & Checkout:** Sistema de pedidos fluido con integración de datos de entrega y contacto.
- **Detección de Mesa por QR:** Identificación automática de la ubicación del cliente mediante parámetros dinámicos.
- **Estética "Ivory Gold":** Diseño minimalista con gradientes dorados vibrantes y efectos de glassmorphism.

### 🤖 Automatización e Inteligencia Artificial
- **Instagram Autopilot:** Sincronización automática de contenido y gestión de mensajes directos mediante IA.
- **Integración con Gemini AI:** Motores de respuesta inteligente para atención al cliente y generación de contenido gastronómico.
- **Webhooks de Meta:** Conectividad en tiempo real con WhatsApp y Messenger.

### 🛠️ Administración y Control (Dashboard)
- **Multi-Tenant:** Soporte para múltiples restaurantes con configuraciones personalizadas por sede.
- **Gestión de Inventario & Kanban:** Control total sobre productos, categorías y flujo de pedidos.
- **Generador de QR Masivo:** Herramienta para desplegar códigos QR físicos en mesas de forma eficiente.
- **SuperAdmin:** Panel global para monitoreo de métricas, gestión de suscripciones y control de inquilinos.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 19 + Vite
- **Animaciones:** Framer Motion
- **Estilos:** TailwindCSS / CSS Moderno
- **Iconografía:** Lucide React
- **Utilidades:** html2canvas, jsPDF, React Router 7

### Backend
- **Framework:** FastAPI (Python)
- **Base de Datos:** PostgreSQL + SQLAlchemy (Async)
- **IA:** Google Generative AI (Gemini)
- **Almacenamiento:** Cloudinary (Imágenes)
- **Programación:** APScheduler para tareas recurrentes

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL

### Configuración del Frontend
1. Entra al directorio raíz:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` basado en las necesidades del proyecto:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Configuración del Backend
1. Navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual e instala dependencias:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configura las variables de entorno en `backend/.env` (DB URL, Cloudinary, Gemini API Key).
4. Inicia el servidor:
   ```bash
   uvicorn main:app --reload
   ```

---

## 📂 Estructura del Proyecto

```text
├── backend/            # Lógica del servidor, modelos de BD y API
│   ├── models.py       # Definición de tablas SQLAlchemy
│   ├── main.py         # Endpoints y lógica principal
│   └── utils/          # Herramientas de IA, Cloudinary y Auth
├── src/                # Código fuente del Frontend (React)
│   ├── components/     # Componentes reutilizables de UI
│   ├── AdminDashboard/ # Panel de control de restaurantes
│   └── MenuEngine/     # Motor de la carta interactiva
├── public/             # Activos estáticos (Logos, imágenes)
└── LICENSE             # Licencia MIT
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

Desarrollado por **FerchoGG2006**
