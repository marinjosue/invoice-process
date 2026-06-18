import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export interface SettlementReportData {
    settlementId: string;
    tenantName: string;
    status: string;
    generationDate: Date;
    finalizedDate?: Date;
    createdByUser: string;
    global_params: {
        flete_total: number;
        seguro_total: number;
        variacion_flete_pct: number;
        fodinfa_pct: number;
        isd_pct: number;
        incremento_pct: number;
    };
    calculated_items: Array<{
        invoice_id: string;
        invoice_number: string;
        description: string;
        quantity: number;
        unit_price: number;
        total_fob: number;
        distribution_pct: number;
        flete: number;
        seguro: number;
        cif: number;
        arancel: number;
        arancel_pct: number;
        fodinfa: number;
        isd: number;
        costo_total: number;
        costo_ventas_indirectos: number;
        valor_unitario_planta: number;
        incremento_pct: number;
        pvp_sugerido: number;
        costo_venta_pct: number;
        ganancia: number;
        contribucion_pct: number;
    }>;
    destination_expenses: Array<{ description: string; amount: number }>;
    summary: {
        total_fob: number;
        total_flete: number;
        total_seguro: number;
        total_cif: number;
        total_arancel: number;
        total_fodinfa: number;
        total_isd: number;
        total_costos: number;
        gastos_destino: number;
        gran_total: number;
    };
}

@Injectable()
export class SettlementReportService {
    private readonly logger = new Logger(SettlementReportService.name);
    private readonly LEFT = 40;
    private readonly RIGHT = 575;
    private readonly PAGE_WIDTH = 535;

    async generatePdf(data: SettlementReportData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 40, bottom: 40, left: 40, right: 40 },
                    bufferPages: true,
                });

                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.buildHeader(doc, data);
                this.buildGlobalParams(doc, data);
                this.buildCalculationTable(doc, data);
                this.buildBottomSection(doc, data);
                this.buildFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ─── Header ───────────────────────────────────────────────

    private buildHeader(doc: any, data: SettlementReportData) {
        doc.fontSize(18).font('Helvetica-Bold')
            .text('LIQUIDACION', this.LEFT, 40, { align: 'center', width: this.PAGE_WIDTH });
        doc.fontSize(10).font('Helvetica')
            .text(data.tenantName, { align: 'center', width: this.PAGE_WIDTH });

        const statusText = this.translateStatus(data.status);
        const badgeColor = data.status === 'FINALIZED' ? '#22c55e' : data.status === 'CANCELLED' ? '#ef4444' : '#f59e0b';

        doc.moveDown(0.6);
        const badgeX = this.LEFT + this.PAGE_WIDTH / 2 - 30;
        const badgeStartY = doc.y;

        doc.roundedRect(badgeX, badgeStartY, 60, 16, 3).fill(badgeColor);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
            .text(statusText, badgeX, badgeStartY + 3, { width: 60, align: 'center' });

        doc.fillColor('#000000');
        doc.y = badgeStartY + 25; // advance cursor manually past the badge

        doc.moveDown(0.6);
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text(
            `ID: ${data.settlementId}  |  Creado: ${this.fmtDate(data.generationDate)}  |  Por: ${data.createdByUser}` +
            (data.finalizedDate ? `  |  Finalizado: ${this.fmtDate(data.finalizedDate)}` : ''),
            this.LEFT, doc.y, { align: 'center', width: this.PAGE_WIDTH },
        );
        doc.fillColor('#000000');
        doc.moveDown(0.4);
        this.drawHR(doc);
        doc.moveDown(0.6);
    }

    // ─── Parametros Globales ──────────────────────────────────

    private buildGlobalParams(doc: any, data: SettlementReportData) {
        this.sectionTitle(doc, 'Parametros Globales');
        doc.moveDown(0.3);

        const gp = data.global_params;
        const params = [
            ['Flete Total', this.$(gp.flete_total)],
            ['Seguro Total', this.$(gp.seguro_total)],
            ['% Var. Flete', `${gp.variacion_flete_pct}%`],
            ['% FODINFA', `${gp.fodinfa_pct}%`],
            ['% ISD', `${gp.isd_pct}%`],
            ['% Incremento', `${gp.incremento_pct}%`],
        ];

        const colWidth = this.PAGE_WIDTH / 4;
        const startY = doc.y;

        for (let i = 0; i < params.length; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const x = this.LEFT + col * colWidth;
            const y = startY + row * 28;

            doc.fontSize(7).font('Helvetica').fillColor('#888888')
                .text(params[i][0], x, y, { width: colWidth - 5 });
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
                .text(params[i][1], x, y + 10, { width: colWidth - 5 });
        }

        const totalRows = Math.ceil(params.length / 4);
        doc.y = startY + totalRows * 28 + 5;
        doc.x = this.LEFT;
        doc.moveDown(0.3);
        this.drawHR(doc);
        doc.moveDown(0.6);
    }

    // ─── Tabla de Calculo ─────────────────────────────────────

    private buildCalculationTable(doc: any, data: SettlementReportData) {
        this.sectionTitle(doc, `Tabla de Calculo (${data.calculated_items.length} items)`);
        doc.moveDown(0.3);

        if (data.calculated_items.length === 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#999999')
                .text('No hay items calculados.', this.LEFT, doc.y);
            doc.fillColor('#000000');
            doc.x = this.LEFT;
            doc.moveDown(1);
            return;
        }

        // Sub-table 1: Base + Import Costs
        this.calcSubHeader(doc, 'Datos Base y Costos de Importacion');
        const h1 = ['Descripcion', 'Cant.', 'P.Unit.', 'Total', '%Dist.', 'Flete', 'Seguro', 'CIF'];
        const w1 = [140, 40, 65, 70, 45, 60, 55, 60];
        this.drawCalcRow(doc, h1, w1, true);

        for (const item of data.calculated_items) {
            this.checkPageBreak(doc, 16);
            this.drawCalcRow(doc, [
                (item.description || '').substring(0, 25),
                item.quantity.toString(),
                this.$(item.unit_price),
                this.$(item.total_fob),
                `${(item.distribution_pct || 0).toFixed(1)}%`,
                this.$(item.flete),
                this.$(item.seguro),
                this.$(item.cif),
            ], w1, false);
        }

        const totals1 = data.calculated_items.reduce(
            (acc, it) => ({
                total_fob: acc.total_fob + it.total_fob,
                flete: acc.flete + it.flete,
                seguro: acc.seguro + it.seguro,
                cif: acc.cif + it.cif,
            }),
            { total_fob: 0, flete: 0, seguro: 0, cif: 0 },
        );
        this.drawCalcRow(doc, [
            'TOTALES:', '', '', this.$(totals1.total_fob), '100%',
            this.$(totals1.flete), this.$(totals1.seguro), this.$(totals1.cif),
        ], w1, true, '#1a365d');

        doc.moveDown(0.6);

        // Sub-table 2: Taxes + Costs
        this.checkPageBreak(doc, 80);
        this.calcSubHeader(doc, 'Impuestos y Costos');
        const h2 = ['Descripcion', '%Aran.', 'Arancel', 'FODINFA', 'ISD', 'Costo Total', 'C.Vent/Und', 'V.U.Planta'];
        const w2 = [120, 40, 60, 60, 60, 70, 65, 60];
        this.drawCalcRow(doc, h2, w2, true);

        for (const item of data.calculated_items) {
            this.checkPageBreak(doc, 16);
            this.drawCalcRow(doc, [
                (item.description || '').substring(0, 22),
                `${(item.arancel_pct || 0).toFixed(1)}%`,
                this.$(item.arancel),
                this.$(item.fodinfa),
                this.$(item.isd),
                this.$(item.costo_total),
                this.$(item.costo_ventas_indirectos),
                this.$(item.valor_unitario_planta),
            ], w2, false);
        }

        doc.moveDown(0.6);

        // Sub-table 3: Price + Margin
        this.checkPageBreak(doc, 80);
        this.calcSubHeader(doc, 'Precio y Margen');
        const h3 = ['Descripcion', '% Inc.', 'PVP Sug.', '%G. Venta', 'Ganancia'];
        const w3 = [175, 80, 105, 85, 90];
        this.drawCalcRow(doc, h3, w3, true);

        for (const item of data.calculated_items) {
            this.checkPageBreak(doc, 16);
            this.drawCalcRow(doc, [
                (item.description || '').substring(0, 33),
                `${item.incremento_pct || 0}%`,
                this.$(item.pvp_sugerido),
                `${((item.costo_venta_pct || 0) * 100).toFixed(0)}%`,
                this.$(item.ganancia),
            ], w3, false);
        }

        doc.moveDown(0.5);
        this.drawHR(doc);
        doc.moveDown(0.6);
    }

    // ─── Bottom Section: Gastos en Destino + Resumen side-by-side ──

    private buildBottomSection(doc: any, data: SettlementReportData) {
        this.checkPageBreak(doc, 120);

        const leftW = this.PAGE_WIDTH * 0.50;
        const rightW = this.PAGE_WIDTH * 0.48;
        const rightX = this.LEFT + leftW + this.PAGE_WIDTH * 0.02;
        const sectionStartY = doc.y;

        // ─── LEFT: Gastos en Destino ───
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
            .text('Gastos en Destino', this.LEFT, sectionStartY);
        doc.fillColor('#000000');
        let leftY = sectionStartY + 18;

        if (!data.destination_expenses || data.destination_expenses.length === 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#999999')
                .text('No hay gastos en destino.', this.LEFT, leftY, { width: leftW });
            doc.fillColor('#000000');
            leftY += 20;
        } else {
            const expH = 14;
            doc.rect(this.LEFT, leftY, leftW, expH).fill('#2c3e50');
            doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
            doc.text('Descripcion', this.LEFT + 4, leftY + 2, { width: leftW * 0.65 });
            doc.text('Monto', this.LEFT + leftW * 0.65 + 4, leftY + 2, { width: leftW * 0.3, align: 'right' });
            doc.fillColor('#000000');
            leftY += expH;

            let expTotal = 0;
            for (const exp of data.destination_expenses) {
                doc.fontSize(7.5).font('Helvetica');
                doc.text(exp.description || '', this.LEFT + 4, leftY + 2, { width: leftW * 0.65 });
                doc.text(this.$(exp.amount), this.LEFT + leftW * 0.65 + 4, leftY + 2, { width: leftW * 0.3, align: 'right' });
                expTotal += exp.amount || 0;
                leftY += 14;
                doc.moveTo(this.LEFT, leftY).lineTo(this.LEFT + leftW, leftY)
                    .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            }

            doc.rect(this.LEFT, leftY, leftW, expH).fill('#1a365d');
            doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
            doc.text('TOTAL GASTOS DESTINO:', this.LEFT + 4, leftY + 2, { width: leftW * 0.65 });
            doc.text(this.$(expTotal), this.LEFT + leftW * 0.65 + 4, leftY + 2, { width: leftW * 0.3, align: 'right' });
            doc.fillColor('#000000');
            leftY += expH + 5;
        }

        // ─── RIGHT: Resumen ───
        const s = data.summary;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
            .text('Resumen', rightX, sectionStartY);
        doc.fillColor('#000000');
        let rightY = sectionStartY + 18;

        const summaryItems: Array<[string, string, boolean?]> = [
            ['Total Base (FOB)', this.$(s.total_fob)],
            ['Total Flete', this.$(s.total_flete)],
            ['Total Seguro', this.$(s.total_seguro)],
            ['Total CIF', this.$(s.total_cif)],
            ['', '', false],
            ['Total Arancel', this.$(s.total_arancel)],
            ['Total FODINFA', this.$(s.total_fodinfa)],
            ['Total ISD', this.$(s.total_isd)],
            ['', '', false],
            ['Total Costos', this.$(s.total_costos)],
            ['Gastos en Destino', this.$(s.gastos_destino)],
        ];

        const summaryH = summaryItems.length * 14 + 35;
        doc.rect(rightX - 5, rightY - 3, rightW + 10, summaryH).fill('#f8fafc');
        doc.fillColor('#000000');

        for (const [label, value, show] of summaryItems) {
            if (show === false) { rightY += 5; continue; }
            doc.fontSize(8).font('Helvetica')
                .text(label, rightX + 5, rightY, { width: rightW - 60 });
            doc.fontSize(8).font('Helvetica-Bold')
                .text(value as string, rightX + rightW - 60, rightY, { width: 55, align: 'right' });
            rightY += 14;
        }

        doc.moveTo(rightX + 5, rightY).lineTo(rightX + rightW, rightY)
            .strokeColor('#333333').lineWidth(1.5).stroke();
        rightY += 6;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d')
            .text('GRAN TOTAL', rightX + 5, rightY, { width: rightW - 70 });
        doc.fontSize(11).font('Helvetica-Bold')
            .text(this.$(s.gran_total), rightX + rightW - 70, rightY, { width: 65, align: 'right' });
        doc.fillColor('#000000');
        rightY += 20;

        doc.y = Math.max(leftY, rightY) + 10;
        doc.x = this.LEFT;
    }

    // ─── Footer ───────────────────────────────────────────────

    private buildFooter(doc: any) {
        const pages = doc.bufferedPageRange();
        for (let i = pages.start; i < pages.start + pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(7).fillColor('#aaaaaa')
                .text(
                    `Pagina ${i + 1} de ${pages.count}`,
                    this.LEFT, 750,
                    { align: 'center', width: this.PAGE_WIDTH },
                )
                .fillColor('#000000');
        }
    }

    // ─── Drawing Helpers ──────────────────────────────────────

    private sectionTitle(doc: any, title: string) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
            .text(title, this.LEFT, doc.y, { width: this.PAGE_WIDTH });
        doc.fillColor('#000000');
        doc.x = this.LEFT;
    }

    private calcSubHeader(doc: any, title: string) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569')
            .text(title, this.LEFT, doc.y);
        doc.fillColor('#000000');
        doc.x = this.LEFT;
        doc.moveDown(0.2);
    }

    private drawCalcRow(doc: any, cells: string[], colWidths: number[], isHeader: boolean, headerColor: string = '#2c3e50') {
        const rowH = 15;
        const y = doc.y;
        const totalW = colWidths.reduce((a, b) => a + b, 0);

        if (isHeader) {
            doc.rect(this.LEFT, y - 1, totalW, rowH).fill(headerColor);
            doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
        } else {
            doc.fillColor('#000000').fontSize(7.5).font('Helvetica');
        }

        let x = this.LEFT;
        for (let i = 0; i < cells.length; i++) {
            doc.text(cells[i], x + 3, y + 2, { width: colWidths[i] - 6, height: rowH, ellipsis: true });
            x += colWidths[i];
        }

        if (isHeader) { doc.fillColor('#000000'); }

        doc.x = this.LEFT;
        doc.y = y + rowH;

        if (!isHeader) {
            doc.moveTo(this.LEFT, doc.y).lineTo(this.LEFT + totalW, doc.y)
                .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        }
    }

    private drawHR(doc: any) {
        doc.moveTo(this.LEFT, doc.y).lineTo(this.RIGHT, doc.y)
            .strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    }

    private checkPageBreak(doc: any, requiredSpace: number) {
        if (doc.y + requiredSpace > 730) { doc.addPage(); }
    }

    // ─── Format Helpers ───────────────────────────────────────

    private $(val: number): string {
        if (val == null || isNaN(val)) return '$0.00';
        return `$${val.toFixed(2)}`;
    }

    private fmtDate(date: Date): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    private translateStatus(status: string): string {
        const map: Record<string, string> = { DRAFT: 'BORRADOR', FINALIZED: 'FINALIZADO', CANCELLED: 'CANCELADO' };
        return map[status] || status;
    }
}
