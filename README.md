# SPA TypeScript + esbuild + Firebase Auth

Proyecto base mínimo sin Vite. Incluye login con correo/contraseña y Google, estado de sesión y logout.

## Requisitos
- Node.js 18+
- Una app Web en Firebase Console (para obtener el objeto de configuración).

## Instalación
```bash
npm i
npm run dev
# abre la URL de esbuild (por defecto http://127.0.0.1:8000)
```

Antes, edita `src/lib/firebase.ts` y pega tu configuración de Firebase.

## Build
```bash
npm run build
# genera public/app.js
```
