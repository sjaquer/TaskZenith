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

### 3. Configura las Variables de Entorno

Antes de iniciar, debes configurar tus credenciales.
Crea un archivo llamado `.env` en la raíz del proyecto (puedes duplicar y renombrar el archivo `.env.example`) y añade tus claves:

```env
# Firebase Configuration - Required
# IMPORTANT: These variables must be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
NEXT_PUBLIC_FIREBASE_API_KEY="TU_API_KEY_DE_FIREBASE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="TU_AUTH_DOMAIN_DE_FIREBASE"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="TU_PROJECT_ID_DE_FIREBASE"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="TU_STORAGE_BUCKET_DE_FIREBASE"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_MESSAGING_SENDER_ID_DE_FIREBASE"
NEXT_PUBLIC_FIREBASE_APP_ID="TU_APP_ID_DE_FIREBASE"

# Genkit/Gemini API Key - Required for AI features
# This key is used on the server-side, so it does not need the NEXT_PUBLIC_ prefix.
GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
```
Puedes encontrar tus credenciales de Firebase en la configuración de tu proyecto en la [Consola de Firebase](https://console.firebase.google.com/). La `GEMINI_API_KEY` la obtienes desde [Google AI Studio](https://aistudio.google.com/app/apikey).

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

Para adaptar este proyecto a tu propia cuenta y necesidades, sigue estos pasos:

### 1. Configuración de Firebase y Gemini

El corazón de la aplicación (base de datos y IA) se configura a través de variables de entorno.

*   **Archivo Clave:** `.env`
*   **Qué hacer:**
    1.  Crea una copia del archivo `.env.example` y renómbrala a `.env`.
    2.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
    3.  Crea un nuevo proyecto o selecciona uno existente.
    4.  En la configuración de tu proyecto, ve a la sección "Tus apps" y crea una nueva aplicación web.
    5.  Firebase te proporcionará un objeto de configuración `firebaseConfig`. Copia los valores de ese objeto en las variables `NEXT_PUBLIC_FIREBASE_*` correspondientes en tu archivo `.env`.
    6.  Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) para generar una clave de API para Gemini y pégala en la variable `GEMINI_API_KEY`.

### 2. Lógica de Inteligencia Artificial (Genkit)

Puedes personalizar cómo la IA interpreta los comandos o genera las tareas.

*   **Archivos Clave:**
    *   `src/ai/flows/generate-tasks.ts`: Controla cómo se generan las subtareas a partir de una descripción.
    *   `src/ai/flows/process-voice-command.ts`: Controla cómo se interpretan los comandos de voz.
*   **Qué hacer:**
    *   **Ajustar los Prompts:** Dentro de cada archivo, encontrarás una variable `...Prompt`. Puedes modificar el texto del `prompt` para cambiar las instrucciones que le das al modelo de IA. Por ejemplo, puedes hacer que sea más estricto con las categorías, que use un tono diferente o que pida más detalles.
    *   **Cambiar el Modelo:** En `src/ai/genkit.ts`, puedes cambiar el modelo de Gemini por otro que se ajuste mejor a tus necesidades (ej. `gemini-pro-vision` si quisieras analizar imágenes en el futuro).

### 3. Estilos y Apariencia

*   **Colores y Tema:**
    *   `src/app/globals.css`: Aquí puedes cambiar los valores de las variables CSS (ej. `--primary`, `--background`) para alterar la paleta de colores de toda la aplicación.
*   **Fuentes y Componentes:**
    *   `tailwind.config.ts`: Modifica este archivo para extender la configuración de Tailwind, como añadir nuevas fuentes o espaciados.
    *   `src/components/ui/`: Estos son los componentes de ShadCN. Puedes personalizarlos directamente si lo necesitas.

### 4. Contenido y Tareas por Defecto

*   **Tareas Diarias:**
    *   `src/contexts/task-context.tsx`: Dentro de este archivo, busca la variable `defaultDailyTasks`. Puedes modificar esta lista para cambiar las tareas diarias que aparecen por defecto para un nuevo usuario.

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
