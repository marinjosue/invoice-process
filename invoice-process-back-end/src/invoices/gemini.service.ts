import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async extractInvoiceDataFromBuffer(fileBuffer: Buffer, mimeType: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const base64Data = fileBuffer.toString('base64');

              const prompt = `
        Eres un experto en extracción de datos de facturas. Analiza esta factura y extrae TODA la información con máxima precisión.

        RESPONDE ÚNICAMENTE CON EL JSON INDICADO ABAJO, SIN MARKDOWN, SIN COMENTARIOS, SIN TEXTO ADICIONAL.

        {
          "cabecera": {
            "numeroFactura": "string (Invoice #, Factura #, No., Number, etc)",
            "fechaFactura": "YYYY-MM-DD (convierte cualquier formato a este)",
            "proveedorNombre": "string (nombre completo del proveedor/supplier)",
            "ruc": "string o null (RUC, NIT, Tax ID, VAT, RFC, CUIT, cualquier identificador fiscal)",
            "pais": "string o null (código ISO o nombre del país del proveedor)",
            "email": "string o null (email de contacto del proveedor)",
            "telefono": "string o null (teléfono del proveedor, incluye código de país si está)",
            "direccion": "string o null (dirección completa del proveedor)",
            "moneda": "string (USD, EUR, PEN, CLP, MXN, ARS, COP, etc - código ISO 4217)",
            "subtotal": number (subtotal SIN impuestos, calcula sumando items si no está explícito),
            "impuestos": number (suma de TODOS los impuestos: IVA, TAX, IGV, GST, etc),
            "total": number (monto total final a pagar),
            "observaciones": "string o null (notas, términos de pago, condiciones, etc)"
          },
          "items": [
            {
              "codigoProducto": "string o null (SKU, Part #, Code, Código, Item #, P/N, Model)",
              "descripcion": "string (descripción COMPLETA del producto incluyendo marca y modelo si están)",
              "cantidad": number (quantity, qty, cant, unidades),
              "precioUnitario": number (precio por unidad SIN impuestos),
              "totalLinea": number (cantidad × precioUnitario)
            }
          ],
          "confianza": number (0-100, basado en claridad del documento),
          "warnings": ["array de strings con advertencias"]
        }

        INSTRUCCIONES CRÍTICAS:

        ITEMS/PRODUCTOS:
        - Extrae TODOS los productos/items de la tabla/lista de la factura
        - Busca códigos de producto en columnas: SKU, Code, Part Number, Item #, Código, P/N, Model
        - Si hay marca y modelo, inclúyelos en la descripción: "Laptop HP ProBook 450 G8"
        - Si solo hay descripción genérica, cópiala tal cual
        - Verifica que cantidad × precioUnitario = totalLinea (si no coincide, agrega warning)

        CÁLCULOS Y MONTOS:
        - Identifica la moneda: símbolos ($, €, £, S/, etc) o texto (USD, EUR, PEN, etc)
        - subtotal = suma de todos los totalLinea de items (SIN impuestos)
        - impuestos = busca IVA, TAX, IGV, GST, VAT, Impuesto, Tax Amount, etc
        - total = subtotal + impuestos (debe coincidir con "Total", "Amount Due", "Total a Pagar")
        - Si los cálculos no cuadran, agrega warning específico

        DATOS DEL PROVEEDOR:
        - Busca el nombre en: "Vendor", "Supplier", "Proveedor", "From", "Sold by", sección superior
        - RUC/Tax ID en: "RUC", "NIT", "Tax ID", "VAT", "RFC", "CUIT", "EIN", "Taxpayer ID"
        - País: puede estar en dirección o código de teléfono
        - Email: busca patrones de correo electrónico
        - Teléfono: incluye código de país si está (+51, +1, etc)

        FECHA:
        - Convierte cualquier formato a YYYY-MM-DD
        - Formatos comunes: DD/MM/YYYY, MM/DD/YYYY, DD-MMM-YYYY, etc
        - Busca en: "Date", "Invoice Date", "Fecha", "Fecha de Emisión"

        VALIDACIONES:
        - Número de factura debe ser único y claro
        - Total debe ser > 0
        - Debe haber al menos 1 item
        - Suma de items debe coincidir con subtotal
        - subtotal + impuestos debe = total

        WARNINGS - Agrega si:
        - Algún campo crítico está vacío (número factura, fecha, proveedor, total)
        - Los cálculos no cuadran (diferencias en totales)
        - La imagen tiene baja calidad o texto ilegible
        - Hay ambigüedad en algún dato
        - Faltan códigos de producto
        - Moneda no está clara
        - Formato de fecha es ambiguo

        NIVEL DE CONFIANZA (0-100):
        - 90-100: Todos los datos claros, cálculos correctos, documento legible
        - 70-89: Datos mayormente claros, algunos campos opcionales vacíos
        - 50-69: Algunos datos ambiguos o ilegibles, cálculos aproximados
        - 30-49: Muchos campos vacíos o poco claros
        - 0-29: Documento muy difícil de leer o formato no estándar

        FORMATO DE SALIDA: JSON puro, sin \`\`\`json, sin comentarios, sin texto explicativo.
        `;
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        data: extractedData,
        confidence: extractedData.confianza || 0,
        warnings: extractedData.warnings || []
      };

    } catch (error) {
      console.error('Error en Gemini Service:', error);
      return {
        success: false,
        error: error.message,
        confidence: 0,
        warnings: ['Error al procesar el documento con Gemini']
      };
    }
  }
}
