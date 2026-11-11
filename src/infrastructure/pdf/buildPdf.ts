import { PDFDocument } from 'pdf-lib'
import { layoutPdfPage, type PaperSize } from '../../domain/export'

export interface JpegImage {
  bytes: Uint8Array
  width: number
  height: number
}

/** Arma un PDF con una imagen JPEG por página, en el orden recibido. */
export async function buildPdf(images: JpegImage[], paper: PaperSize, title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(title)
  pdf.setCreator('DocScan')
  pdf.setProducer('DocScan')

  for (const image of images) {
    const embedded = await pdf.embedJpg(image.bytes)
    const layout = layoutPdfPage(image.width, image.height, paper)
    const page = pdf.addPage([layout.pageWidth, layout.pageHeight])
    page.drawImage(embedded, { x: layout.x, y: layout.y, width: layout.width, height: layout.height })
  }

  return pdf.save()
}
