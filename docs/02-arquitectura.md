# DocScan — Arquitectura

## Stack
| Área | Tecnología | Motivo |
|---|---|---|
| Build | Vite 6 + React 19 + TypeScript | Rápido, estándar |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest + Service Worker + precache |
| Routing | React Router | Pantallas simples |
| Estado | Zustand | Liviano, sin boilerplate |
| Persistencia | IndexedDB con Dexie | Guarda blobs de imágenes |
| Visión | OpenCV.js (WASM) en **Web Worker**, carga diferida | Bordes + perspectiva sin bloquear la UI |
| PDF | pdf-lib | Multipágina, control de tamaño |
| Drag & drop | dnd-kit (sortable) | Soporta touch |
| Estilos | Tailwind CSS v4 | Rápido, mobile-first |
| Tests | Vitest + Testing Library | Integrado con Vite |
| Deploy | Vercel / Netlify | HTTPS gratis |

## Estructura de carpetas (por feature, clean architecture)
```
src/
  app/                 # router, providers, layout
  features/
    capture/           # cámara, galería, ráfaga
    crop/              # editor de esquinas, perspectiva
    page-editor/       # rotar, filtros
    document/          # detalle, reordenar, renombrar
    library/           # lista, búsqueda
    export/            # PDF, compartir, JPG
  domain/              # entidades y reglas puras (sin React)
    document.ts
    page.ts
  infrastructure/
    db/                # Dexie: repositorios
    vision/            # worker OpenCV + cliente
    pdf/               # generador pdf-lib
  shared/              # componentes UI, hooks, utils
```
Regla: `domain` no depende de nada; `features` usan `domain` e `infrastructure` a través de interfaces (repositorios/servicios).

## Modelo de datos (IndexedDB)
```ts
interface Document {
  id: string;            // uuid
  name: string;
  pageIds: string[];     // ORDEN de las páginas
  createdAt: number;
  updatedAt: number;
  thumbnailBlob?: Blob;
}

interface Page {
  id: string;
  documentId: string;
  originalBlob: Blob;    // foto original (redimensionada) → permite re-recortar
  processedBlob: Blob;   // resultado final (recorte + filtro + rotación)
  corners: [Point, Point, Point, Point];
  rotation: 0 | 90 | 180 | 270;
  filter: 'original' | 'grayscale' | 'bw' | 'enhanced';
  brightness: number;    // -100..100
  contrast: number;      // -100..100
}
```
- El orden vive en `Document.pageIds` → reordenar = reescribir un array.
- Renombrar = actualizar `name` + `updatedAt`.

## Pipeline de imagen
```
captura → resize (≤2000px) → [worker] detectar contorno → usuario ajusta esquinas
       → [worker] warpPerspective → rotación → filtro → JPEG (q≈0.85) → processedBlob
```

## Exportación PDF
1. Leer `processedBlob` en el orden de `pageIds`.
2. Recomprimir según la calidad elegida (Alta 0.9 / Media 0.75 / Baja 0.6, y tamaño máximo).
3. `pdf-lib`: `embedJpg` + página A4/Carta/ajustada.
4. `File([...], `${name}.pdf`)` → `navigator.share({ files })` o descarga.

## Pantallas
| Ruta | Pantalla |
|---|---|
| `/` | Biblioteca (lista de documentos) |
| `/scan` | Cámara |
| `/doc/:id` | Detalle: miniaturas, reordenar, renombrar |
| `/doc/:id/page/:pageId/crop` | Editor de esquinas |
| `/doc/:id/page/:pageId/edit` | Filtros y rotación |
| `/doc/:id/export` | Opciones de PDF y compartir |

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| OpenCV.js pesa ~8 MB | Carga diferida en worker + precache del SW |
| Memoria en celulares | Resize temprano, liberar `ObjectURL`, procesar de a una página |
| iOS borra el almacenamiento | `storage.persist()` + aviso para exportar |
| Web Share con archivos falla en iOS | Fallback a descarga |
