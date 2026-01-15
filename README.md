<p align="center">
  <img src="public/logo.png" alt="TaskZenith Logo" width="140" style="border-radius: 50%;" />
</p>

# TaskZenith - Gestión Corporativa de Tareas

> **"Gestión colaborativa y sincronización en la nube para equipos productivos."**

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.9-black?logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-teal?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-11.10-yellow?logo=firebase&logoColor=white" />
</p>

---

## 🧠 Descripción General

**TaskZenith** es una plataforma avanzada de gestión de tareas corporativas diseñada para equipos que necesitan colaboración en tiempo real, sincronización multiplataforma y personalización completa de su espacio de trabajo.

### Características Principales

- ✅ **Dashboard Adaptativo**: Sistema de grid libre (48 columnas) con widgets redimensionables y reorganizables
- 🔐 **Autenticación Robusta**: Códigos de acceso con roles diferenciados (Admin/Operador)
- ☁️ **Sincronización en la Nube**: Configuración personal guardada en Firestore para acceso desde cualquier dispositivo
- 🎨 **Temas Personalizables**: 8 paletas de colores predefinidas con guardado automático
- 📊 **Múltiples Vistas**: Todo List, Kanban, Calendario, Historial y Estadísticas
- ⏱️ **Pomodoro Timer**: Temporizador integrado para gestión de tiempo
- 🔔 **Alertas Inteligentes**: Notificaciones de tareas vencidas y próximas
- 📱 **Responsive Design**: Optimizado para escritorio, tablet y móvil

---

## 🛠️ Arquitectura Técnica

### Stack Tecnológico

- **Frontend**: Next.js 15.5.9 (App Router) + React 19 + TypeScript 5
- **UI Framework**: TailwindCSS + shadcn/ui components
- **Base de Datos**: Firebase Firestore (sincronización en tiempo real)
- **Autenticación**: Firebase Authentication con roles personalizados
- **Estado Global**: React Context API con persistencia en Firestore
- **Interactividad**: Sistema drag-and-drop personalizado con detección de colisiones

### Sistema de Grid Personalizable

El dashboard utiliza un sistema de grid adaptativo de **48 columnas virtuales**:

- **Posicionamiento fluido**: Basado en porcentajes para responsividad total
- **Altura libre**: Definida en píxeles para máxima flexibilidad
- **Drag & Drop**: Movimiento libre con colisiones opcionales
- **Snap magnético**: Alineación automática cada 10px
- **Persistencia**: Guardado automático en Firestore por usuario

```typescript
// Ejemplo de configuración de widget
{
  id: "stats",
  x: 0,        // columna inicial (0-47)
  y: 0,        // posición Y en píxeles
  width: 48,   // ancho en columnas
  height: 180, // altura en píxeles
  minW: 16,    // ancho mínimo
  minH: 140    // altura mínima
}
```

---

## 📋 Estructura del Proyecto

```
TaskZenith/
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Dashboard principal con grid
│   │   │   ├── todo/page.tsx
│   │   │   ├── kanban/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── globals.css
│   │   ├── grid-layout.css       # Estilos del grid adaptativo
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx     # Sidebar + navegación
│   │   │   └── page-wrapper.tsx
│   │   ├── tasks/
│   │   │   ├── task-stats-cards.tsx    # Widgets responsive
│   │   │   ├── todo-list.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   ├── calendar-widget.tsx
│   │   │   ├── due-tasks-widget.tsx
│   │   │   └── pomodoro-timer.tsx
│   │   └── ui/                   # Componentes shadcn/ui
│   ├── contexts/
│   │   ├── auth-context.tsx      # Autenticación + roles
│   │   ├── task-context.tsx      # Estado de tareas
│   │   └── theme-context.tsx     # Temas + sincronización
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── firebase.ts           # Configuración Firebase
│   │   ├── types.ts              # Definiciones TypeScript
│   │   └── utils.ts
│   └── ai/                        # (Funcionalidad futura)
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## 💾 Instalación y Configuración

### Requisitos Previos

- Node.js 18.17+ 
- npm o yarn
- Proyecto Firebase configurado

### 1. Clona el Repositorio

```bash
git clone https://github.com/sjaquer/TaskZenith.git
cd TaskZenith
```

### 2. Instala Dependencias

```bash
npm install
```

### 3. Configura Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Configura Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Authentication** (Email/Password)
4. Habilita **Firestore Database**
5. Configura las reglas de seguridad de Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Ejecuta en Modo Desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:3000`

### 6. Build de Producción

```bash
npm run build
npm start
```

---

## 🎯 Códigos de Acceso

La aplicación usa códigos de acceso para diferenciar roles:

- **TASKZENITH-ADMIN**: Acceso de administrador (todas las funcionalidades)
- **TASKZENITH-CORP**: Acceso de operador (funciones estándar)

Estos códigos se validan en el registro (signup). Puedes modificarlos en `src/app/(auth)/signup/page.tsx`.

---

## 🎨 Personalización

### Temas

El sistema incluye 8 temas predefinidos:

1. **Default Dark** - Tema oscuro base
2. **Lavanda Suave** - Tonos violetas relajantes
3. **Bosque Neón** - Verdes brillantes
4. **Océano Profundo** - Azules intensos
5. **Café Caliente** - Marrones cálidos
6. **Rojo Escarlata** - Rojos dramáticos
7. **Menta Fresca** - Verdes agua
8. **Atardecer Neón** - Rosas y amarillos

Los temas se configuran en `src/contexts/theme-context.tsx` y se guardan automáticamente en Firestore por usuario.

### Widgets del Dashboard

Puedes activar/desactivar widgets desde el botón "Configuración":

- **Estadísticas**: Resumen de tareas
- **Lista de Tareas**: Gestión principal
- **Vencimientos**: Tareas próximas
- **Pomodoro**: Temporizador
- **Calendario**: Vista mensual

Cada widget es:
- ✅ **Redimensionable**: Ajusta ancho y alto libremente
- ✅ **Movible**: Arrastra a cualquier posición
- ✅ **Responsive**: Se adapta automáticamente al tamaño de pantalla
- ✅ **Persistente**: Tu configuración se guarda en la nube

---

## 🚀 Funcionalidades Avanzadas

### Dashboard Adaptativo

El sistema de grid permite una personalización total:

```typescript
// Modo Edición
- Click en "Editar" para activar modo de edición
- Arrastra widgets desde la barra de título (azul)
- Redimensiona desde la esquina inferior derecha
- Los cambios se guardan automáticamente en Firestore

// Configuración
- Botón "Configuración" para acceder a:
  - Selector de temas (8 paletas)
  - Activar/desactivar widgets
  - Auto-ordenar (compactación vertical)
  - Reset a configuración por defecto
```

### Sincronización Multi-Dispositivo

Todas las preferencias se sincronizan automáticamente:

- **Layouts del dashboard**: Posición y tamaño de cada widget
- **Temas**: Paleta de colores seleccionada
- **Tareas y Proyectos**: Datos completos en tiempo real
- **Configuración de widgets**: Cuáles están activos

Inicia sesión desde cualquier dispositivo y encontrarás tu espacio exactamente como lo dejaste.

---

## 📱 Responsive Design

La aplicación se adapta completamente a diferentes tamaños de pantalla:

- **Desktop (>1024px)**: Sidebar lateral fijo + grid completo
- **Tablet (768-1024px)**: Navegación adaptada + grid optimizado
- **Mobile (<768px)**: Bottom navigation + grid en columna única

Los widgets internos también son responsive:
- Grid adaptativo en estadísticas (2x2 en móvil, 4x1 en desktop)
- Pomodoro con texto fluido (`clamp()`)
- Listas con scroll vertical automático
- Calendario con layout flexible

---

## 🔒 Seguridad

- **Autenticación Firebase**: Sistema robusto con gestión de sesiones
- **Roles personalizados**: Control de acceso basado en códigos
- **Reglas Firestore**: Validación de permisos en servidor
- **Validación de formularios**: Zod + React Hook Form
- **Variables de entorno**: Configuración sensible protegida

---

## 📝 Licencia

Distribuido bajo la Licencia MIT. Consulta `LICENSE` para más información.

---

## 👨‍💻 Autor

Desarrollado por **Sebastián Jaque**

- GitHub: [@sjaquer](https://github.com/sjaquer)
- Proyecto: [TaskZenith](https://github.com/sjaquer/TaskZenith)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📮 Soporte

Si encuentras algún problema o tienes sugerencias, abre un [issue](https://github.com/sjaquer/TaskZenith/issues).

---

<p align="center">
  Hecho con ❤️ usando Next.js, React y Firebase
</p>
