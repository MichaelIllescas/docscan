# DocScan — Requisitos

## Visión
PWA instalable en el celular para escanear documentos con la cámara y exportarlos como PDF. 100% frontend: todo se procesa y guarda en el dispositivo, sin servidor ni cuentas.

## Fuera de alcance
- OCR / reconocimiento de texto.
- Backend, login, sincronización en la nube.

## Requisitos funcionales

### RF-01 Captura
- Tomar foto con la cámara trasera (vista en vivo vía `getUserMedia`).
- Alternativa: importar imágenes desde la galería (selección múltiple).
- Modo ráfaga: capturar varias páginas seguidas sin salir de la cámara.
- Flash/linterna si el dispositivo lo soporta.

### RF-02 Detección de bordes
- Detectar automáticamente el contorno del documento en la foto.
- Mostrar las 4 esquinas editables (arrastrables) con lupa al arrastrar.
- Si no detecta bordes, usar la imagen completa como recorte.

### RF-03 Corrección de perspectiva
- Enderezar el documento a un rectángulo a partir de las 4 esquinas.

### RF-04 Edición de página
- Rotar 90° (izq/der).
- Filtros: Original, Escala de grises, Blanco y negro (escáner), Mejorado (contraste/brillo).
- Ajuste fino de brillo y contraste.
- Re-recortar una página ya procesada (se conserva la imagen original).

### RF-05 Gestión de páginas
- Ver miniaturas de todas las páginas del documento.
- **Reordenar páginas** arrastrando (touch drag & drop).
- Eliminar página (con confirmación).
- Duplicar página.
- Agregar más páginas a un documento existente.

### RF-06 Documentos
- Lista de documentos guardados (miniatura, nombre, nº páginas, fecha).
- **Renombrar** documento (nombre por defecto: `Scan AAAA-MM-DD HH-mm`).
- Eliminar documento (con confirmación).
- Buscar por nombre y ordenar por fecha/nombre.
- Duplicar documento.

### RF-07 Exportar PDF
- Generar PDF multipágina en el orden definido.
- Opciones: tamaño de página (A4, Carta, Ajustado a imagen), calidad (Alta / Media / Baja → tamaño del archivo).
- El archivo usa el nombre del documento (`<nombre>.pdf`).
- Mostrar el tamaño estimado antes de exportar.

### RF-08 Compartir / descargar
- Compartir el PDF con la Web Share API (WhatsApp, mail, Drive...).
- Fallback: descarga directa del archivo.
- Exportar páginas sueltas como JPG.

### RF-09 PWA
- Instalable (manifest, iconos, splash).
- Funciona offline completo tras la primera carga.
- Aviso cuando hay una nueva versión disponible.
- **Invitación a instalar propia** (el navegador no garantiza mostrarla):
  - Android/Chrome: capturar `beforeinstallprompt` y mostrar botón/banner "Instalar app" que abre el diálogo nativo.
  - iOS/Safari: banner con instrucciones ("Compartir → Agregar a inicio"), ya que no existe aviso nativo.
  - Ocultarla si la app ya corre instalada (`display-mode: standalone` / `navigator.standalone`) o si el usuario la descartó (recordar en `localStorage`).

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | Privacidad: ninguna imagen sale del dispositivo. |
| RNF-02 | Mobile-first, usable con una mano, respeta safe areas (notch). |
| RNF-03 | Procesamiento de imagen < 2 s por página en un gama media. |
| RNF-04 | Imágenes redimensionadas a máx. 2000 px de lado largo para controlar memoria y peso. |
| RNF-05 | Almacenamiento persistente solicitado (`navigator.storage.persist()`); mostrar espacio usado. |
| RNF-06 | Funciona en Chrome Android (objetivo principal) y Safari iOS 16+. |
| RNF-07 | Requiere HTTPS (cámara y Service Worker). |

## Flujos principales
1. **Nuevo escaneo:** Inicio → Cámara → (captura N páginas) → Ajustar esquinas por página → Filtro → Documento → Exportar/Compartir.
2. **Editar existente:** Inicio → Documento → reordenar / rotar / filtro / eliminar / agregar páginas → Exportar.
3. **Renombrar:** Documento → tocar el nombre → editar → guardar.
