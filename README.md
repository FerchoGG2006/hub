# 🚀 Platorin OS | Sistema Operativo para Restaurantes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-orange.svg)](https://deepmind.google/technologies/gemini/)

**Platorin** es la plataforma de operación y ventas diseñada para modernizar negocios gastronómicos. No es solo una carta digital; es un sistema operativo integral que unifica pedidos, pagos, cocina y automatización en una experiencia moderna de alta fidelidad.

---

## ✨ Transformación Operacional

### 📈 Maximiza tus Ventas

- **Pedidos & Pagos Digitales:** Reduce tiempos de espera y optimiza la rotación de mesas con autogestión fluida.
- **WhatsApp & Social Commerce:** Convierte conversaciones en ventas directas sincronizadas con tu inventario.
- **Recomendaciones con IA:** Motor inteligente que sugiere productos para aumentar el ticket promedio de forma invisible.

### ⚡ Optimiza tu Operación

- **Kanban de Cocina en Tiempo Real:** Visualiza y gestiona el flujo de pedidos sin caos ni papeles.
- **Control Multi-Sede:** Monitorea y administra todos tus locales desde un dashboard unificado y profesional.
- **Analytics Estratégico:** Toma decisiones basadas en datos reales de consumo y comportamiento de clientes.

### 🤖 Inteligencia & Automatización

- **Automatización de Marketing:** Sincronización con Instagram y TikTok para atraer clientes de forma autónoma.
- **Gestión de Inventario Inteligente:** Alertas y sugerencias automáticas basadas en la demanda proyectada.
- **Infraestructura Moderna:** Basado en WebSockets para sincronización instantánea en todos los dispositivos.

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
