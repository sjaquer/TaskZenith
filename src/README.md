<p align="center">
  <img src="public/logo.png" alt="TaskZenith Logo" width="140" style="border-radius: 50%;" />
</p>

# TaskZenith

> **“Alcanza la calma y la productividad, una tarea a la vez.”**

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3-black?logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.3-blue?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-teal?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Genkit-1.14-orange?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-11.10-yellow?logo=firebase&logoColor=white" />
</p>

---

## 🧠 Descripción General

**TaskZenith** es una aplicación web de gestión de tareas y productividad, diseñada para ofrecer una experiencia de usuario tranquila y enfocada. Construida con un stack tecnológico moderno que incluye Next.js, React y Firebase, la aplicación integra inteligencia artificial a través de **Genkit (Gemini)** para ofrecer funcionalidades avanzadas como la generación de tareas a partir de descripciones y la creación de tareas mediante comandos de voz.

El objetivo es fusionar un diseño minimalista y elegante con herramientas potentes de organización, como listas de tareas categorizadas, un tablero Kanban y un historial de actividad.

---

## 🛠️ Historia del Desarrollo

### 🔹 Objetivo Inicial

*   Crear un gestor de tareas robusto que vaya más allá de las funcionalidades básicas.
*   Implementar una interfaz de usuario limpia, inspirada en colores lavanda y acentos suaves para promover la concentración.
*   Integrar IA para asistir al usuario, haciendo la creación y gestión de tareas más rápida e intuitiva.
*   Asegurar la persistencia de datos en tiempo real utilizando Firestore.

### 🔹 Desafíos Principales

*   **Integración de IA Contextual:** Lograr que la IA (Genkit) no solo genere tareas genéricas, sino que entienda el contexto de los proyectos del usuario (descripciones, tareas existentes) para ofrecer sugerencias verdaderamente relevantes.
*   **Gestión de Estado Compleja:** Manejar un estado global reactivo para tareas, proyectos y configuraciones de usuario a través de toda la aplicación, sincronizándolo de manera eficiente con Firestore.
*   **Comandos de Voz:** Implementar la funcionalidad de voz a texto de manera fiable, procesando el lenguaje natural para extraer entidades (títulos, prioridades, categorías) y convertirlas en datos estructurados.

### 🔹 Soluciones Adoptadas

*   **Stack Next.js + TypeScript:** Para un rendimiento optimizado (renderizado en servidor), tipado estricto y una base de código escalable.
*   **Tailwind CSS + ShadCN UI:** Para un desarrollo rápido de componentes UI modernos, personalizables y accesibles, manteniendo la consistencia visual.
*   **Firebase (Firestore):** Como base de datos NoSQL en tiempo real para garantizar que los datos estén siempre sincronizados entre dispositivos.
*   **Genkit (Google AI):** Para orquestar los flujos de inteligencia artificial, conectando la lógica de la aplicación con los modelos de Gemini de forma estructurada y mantenible.
*   **React Context API:** Para una gestión de estado centralizada (`TaskContext`), proveyendo los datos y las funciones de manipulación a todos los componentes que los necesiten sin "prop-drilling".

---

## 📋 Estructura del Proyecto

```
TaskZenith/
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── (rutas)/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── tasks/
│   │   └── ui/ (ShadCN)
│   ├── contexts/
│   │   └── task-context.tsx
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── actions.ts (Server Actions)
│   │   ├── firebase.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── ai/
│       ├── flows/
│       │   ├── generate-tasks.ts
│       │   └── process-voice-command.ts
│       └── genkit.ts
├── .env
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚶‍♂️ Flujo de la Aplicación

1.  **Autenticación y Carga:** Al iniciar, la aplicación carga los datos del usuario (tareas y proyectos) desde Firestore.
2.  **Gestión de Tareas:** El usuario puede añadir, completar, eliminar y editar tareas. Todos los cambios se reflejan inmediatamente en la UI a través del `TaskContext` y se envían a Firestore para su persistencia.
3.  **Generación con IA:**
    *   **Basada en Texto:** El usuario describe una actividad. La descripción, junto con el contexto del proyecto seleccionado (si aplica), se envía a un `flow` de Genkit. La IA analiza el contexto y devuelve una lista de subtareas sugeridas.
    *   **Basada en Voz:** El usuario activa el micrófono. La `Web Speech API` del navegador transcribe la voz a texto. Este texto se envía a un `flow` de Genkit especializado que interpreta el lenguaje natural, extrae las tareas con sus atributos (prioridad, categoría) y las devuelve como datos estructurados.
4.  **Organización Kanban:** Las tareas asignadas a proyectos pueden ser visualizadas y gestionadas en un tablero Kanban con estados personalizables (Pendiente, En Progreso, etc.).

---

## 💾 Instalación y Uso

### 1. Clona el Repositorio

```bash
git clone https://github.com/sjaquer/TaskZenith.git
cd TaskZenith
```

### 2. Instala Dependencias

```bash
npm install
```

### 3. Configura las Variables de Entorno (¡MUY IMPORTANTE!)

Para que la aplicación funcione, necesitas conectar tus propias claves de Firebase y Gemini.

1.  **Crea el archivo `.env`:** Busca el archivo llamado `.env.example` en la raíz del proyecto. Crea una copia de este archivo y renómbrala a `.env`.

2.  **Obtén tus claves de Firebase:**
    *   Ve a la [Consola de Firebase](https://console.firebase.google.com/).
    *   Crea un nuevo proyecto (o selecciona uno que ya tengas).
    *   Dentro de tu proyecto, ve a **Autenticación** (en el menú de la izquierda) y habilita el proveedor de **Correo electrónico y contraseña**.
    *   Ve a **Configuración del proyecto** (el ícono de engranaje en la esquina superior izquierda).
    *   En la pestaña **General**, desplázate hacia abajo hasta "Tus apps".
    *   Haz clic en el ícono `</>` para crear una nueva **Aplicación web**.
    *   Dale un apodo a tu app y registra la aplicación.
    *   Firebase te mostrará un objeto `firebaseConfig`. Copia los valores de este objeto en las variables `NEXT_PUBLIC_*` correspondientes en tu archivo `.env`.

3.  **Obtén tu clave de Gemini:**
    *   Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Haz clic en "Crear clave de API" y copia la clave generada.
    *   Pega esta clave en la variable `GEMINI_API_KEY` de tu archivo `.env`.

Tu archivo `.env` debería verse así, pero con tus propios valores:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...Bg"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:12345:web:abcd123"
GEMINI_API_KEY="AIzaSy...C0"
```

### 4. Ejecuta en Modo Desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:9002` o el puerto que tengas configurado.

### 5. Genera el Build de Producción

```bash
npm run build
```

---

## ✅ Uso y Personalización

*   **Estilos:** Modifica la paleta de colores y las fuentes en `src/app/globals.css` y `tailwind.config.ts`.
*   **Lógica de IA:** Ajusta los `prompts` en los archivos dentro de `src/ai/flows/` para cambiar el comportamiento del asistente de IA.
*   **Datos:** La gestión de datos se centraliza en `src/contexts/task-context.tsx`, que interactúa directamente con Firestore.

---

## 📌 Consideraciones Técnicas

*   **Optimistic UI Updates:** Para una experiencia de usuario fluida, las acciones como añadir o completar una tarea actualizan la UI instantáneamente, mientras la petición a la base de datos se resuelve en segundo plano.
*   **Server Actions de Next.js:** Se utilizan para comunicar el cliente con los flujos de Genkit de forma segura y eficiente.
*   **Componentes Reutilizables:** La arquitectura se basa en componentes modulares (principalmente de ShadCN) para facilitar el mantenimiento y la escalabilidad.

---

## 📝 Licencia

Distribuido bajo la Licencia MIT. Consulta `LICENSE` para más información.

---

## 👨‍💻 Autor

Desarrollado por **Sebastián Jaque**
