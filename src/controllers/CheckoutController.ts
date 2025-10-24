import { validateAvailability } from '@/services/AvailabilityService'
import { createOrder } from '@/services/OrderService'
import { fmtCOP } from '@/utils/money'

export class CheckoutController {
  async confirmAndPay(args: {
    items: any[]; total: number;
    firstName: string; lastName: string; address: string;
    lat: number | null; lng: number | null;
    simulateMs?: number;
  }) {
    // 1) validar disponibilidad
    const issues = await validateAvailability(args.items)
    if (issues.length) {
      const msg = issues.map(i => {
        const kind = i.kind === 'product' ? 'Producto'
                  : i.kind === 'addition' ? 'Adición' : 'Bebida'
        return `• ${kind}: ${i.name ?? i.id} no está disponible`
      }).join('\n')
      throw new Error(`No pudimos confirmar:\n${msg}`)
    }

    // 2) simular pago
    await new Promise(r => setTimeout(r, args.simulateMs ?? 1200))

    // 3) crear orden NEW (monto retenido en escrow)
    const orderId = await createOrder({
      firstName: args.firstName, lastName: args.lastName, address: args.address,
      lat: args.lat, lng: args.lng, items: args.items, total: args.total
    })
    return orderId
  }
}
