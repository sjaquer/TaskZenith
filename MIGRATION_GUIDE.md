# Guía de Migración de Datos de TaskZenith

Sigue estos pasos para asociar todos tus datos existentes (tareas y proyectos creados antes de la implementación de usuarios) a tu nueva cuenta.

**IMPORTANTE:** Realiza estos pasos solo una vez.

---

### Paso 1: Crea tu Cuenta de Usuario

Primero, debes crear la cuenta en la aplicación que se convertirá en la "dueña" de todos los datos antiguos.

1.  Abre la aplicación en tu navegador.
2.  Ve a la página de **Registro** (`/signup`).
3.  Crea una nueva cuenta utilizando **exactamente** las siguientes credenciales:
    *   **Nombre:** `Sebastian Jaque`
    *   **Correo Electrónico:** `jaquesebastian0@gmail.com`
    *   **Contraseña:** `901230`

Una vez creada la cuenta, cierra la sesión o simplemente continúa con el siguiente paso.

---

### Paso 2: Configura las Credenciales de Administrador de Firebase

Para que el script pueda acceder a tu base de datos y modificarla, necesita credenciales de administrador.

1.  **Ve a la Consola de Firebase:** [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Selecciona tu proyecto de TaskZenith.
3.  Haz clic en el ícono de engranaje (Configuración) en la esquina superior izquierda y selecciona **Configuración del proyecto**.
4.  Ve a la pestaña **Cuentas de servicio**.
5.  Haz clic en el botón **"Generar nueva clave privada"**. Se descargará un archivo JSON.
6.  **Renombra** este archivo a `firebase-admin-sdk.json`.
7.  **Mueve** el archivo `firebase-admin-sdk.json` a la raíz de tu proyecto TaskZenith (a la misma altura que `package.json`).

**¡MUY IMPORTANTE!** Este archivo es privado y nunca debe ser compartido ni subido a repositorios públicos. El archivo `.gitignore` ya está configurado para ignorarlo.

---

### Paso 3: Ejecuta el Script de Migración

Ahora que tienes tu cuenta creada y las credenciales de administrador en su lugar, ya puedes ejecutar el script.

1.  Abre una nueva terminal en la raíz de tu proyecto.
2.  Ejecuta el siguiente comando:

    ```bash
    npm run migrate
    ```

3.  El script se conectará a tu base de datos, encontrará tu usuario por el correo electrónico, y comenzará el proceso de migración. Verás mensajes en la consola indicando el progreso.

4.  Una vez que el script termine, todos tus datos antiguos estarán asociados a tu cuenta. ¡Ya puedes iniciar sesión y ver todas tus tareas y proyectos!

---

### Paso 4: Limpieza (Opcional)

Una vez que hayas verificado que todos tus datos están correctos en la aplicación, puedes eliminar el archivo `src/scripts/migrate-data.ts` y el archivo `firebase-admin-sdk.json` si lo deseas, ya que no serán necesarios de nuevo.
