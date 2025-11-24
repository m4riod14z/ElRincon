import { validateAvailability } from '@/services/AvailabilityService'
import { createOrder } from '@/services/OrderService'

export class CheckoutController {
  async confirmAndPay(args: {
    items: any[]
    total: number
    firstName: string
    lastName: string
    phone: string
    address: string
    lat: number | null
    lng: number | null
    simulateMs?: number
  }) {
    const issues = await validateAvailability(args.items)
    if (issues.length) {
      const msg = issues
        .map(i => {
          const kind =
            i.kind === 'product'
              ? 'Producto'
              : i.kind === 'addition'
              ? 'Adición'
              : 'Bebida'
          return `• ${kind}: ${i.name ?? i.id} no está disponible`
        })
        .join('\n')
      throw new Error(`No pudimos confirmar:\n${msg}`)
    }

    await new Promise(r => setTimeout(r, args.simulateMs ?? 1200))

    const orderId = await createOrder({
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      address: args.address,
      lat: args.lat,
      lng: args.lng,
      items: args.items,
      total: args.total
    })

    return orderId
  }
}