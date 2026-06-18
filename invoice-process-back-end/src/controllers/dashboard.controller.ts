import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(
    @InjectModel('Invoice') private invoiceModel: Model<any>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('Supplier') private supplierModel: Model<any>,
    @InjectModel('Settlement') private settlementModel: Model<any>,
  ) {}

  @Get('stats')
  async getStats(@GetUser('tenantId') tenantId: any) {
    const tenantObjectId = new Types.ObjectId(tenantId._id.toString());

    // Estadísticas paralelas
    const [
      totalInvoices,
      totalProducts,
      totalSuppliers,
      totalSettlements,
      pendingInvoices,
      lowStockProducts,
      recentInvoices,
    ] = await Promise.all([
      this.invoiceModel.countDocuments({ tenantId: tenantObjectId }),
      this.productModel.countDocuments({ tenantId: tenantObjectId }),
      this.supplierModel.countDocuments({ tenantId: tenantObjectId }),
      this.settlementModel.countDocuments({ tenantId: tenantObjectId }),
      this.invoiceModel.countDocuments({
        tenantId: tenantObjectId,
        estado: 'pendiente',
      }),
      this.productModel.countDocuments({
        tenantId: tenantObjectId,
        $expr: { $lte: ['$currentStock', '$minStock'] },
      }),
      this.invoiceModel
        .find({ tenantId: tenantObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('supplierId', 'name')
        .select('invoiceNumber invoiceDate total status supplierName currency items')
        .lean(),
    ]);

    // Calcular totales de facturas
    const invoiceStats = await this.invoiceModel.aggregate([
      { $match: { tenantId: tenantObjectId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$montoTotal' },
          avgAmount: { $avg: '$montoTotal' },
        },
      },
    ]);

    return {
      success: true,
      stats: {
        invoices: {
          total: totalInvoices,
          pending: pendingInvoices,
          totalAmount: invoiceStats[0]?.totalAmount || 0,
          avgAmount: invoiceStats[0]?.avgAmount || 0,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
        },
        suppliers: {
          total: totalSuppliers,
        },
        settlements: {
          total: totalSettlements,
        },
        recentInvoices,
      },
    };
  }
}
