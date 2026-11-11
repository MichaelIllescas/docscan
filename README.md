# DocScan

PWA para escanear documentos con el celular y exportarlos a PDF. Todo se procesa localmente, sin servidor.

## Documentación
- [Requisitos](docs/01-requisitos.md)
- [Arquitectura](docs/02-arquitectura.md)

## Roadmap
| Fase | Contenido | Estado |
|---|---|---|
| 0 | Setup: Vite + React + TS, Tailwind, PWA, deploy | ✅ (falta deploy) |
| 1 | Biblioteca + persistencia (Dexie), crear/renombrar/eliminar documento | ✅ |
| 2 | Captura: cámara, galería, ráfaga | ✅ (falta probar cámara en celular) |
| 3 | Detección de bordes + editor de esquinas + perspectiva (OpenCV worker) | ⏳ |
| 4 | Edición de página: rotar, filtros, brillo/contraste | ⏳ |
| 5 | Gestión de páginas: reordenar (drag), duplicar, eliminar, agregar | ⏳ |
| 6 | Exportar PDF (tamaño, calidad) + compartir / descargar / JPG | ⏳ |
| 7 | Pulido: offline, aviso de actualización, invitación a instalar (Android + iOS), almacenamiento persistente, pruebas en celular | ⏳ |

## Desarrollo
```bash
npm install
npm run dev            # servidor local
npm run build          # build de producción + service worker
npm run preview        # probar el build (PWA)
npm run generate-pwa-assets   # regenerar iconos desde public/logo.svg
```
