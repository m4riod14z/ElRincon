// src/services/OrderService.ts
import { supabase } from '@/services/SupabaseClient'

type OrderItem = {
  productId: number
  basePrice: number
  qty: number
  addition?: { id: number; name: string; price: number } | null
  drink?: { id: number; name: string; price: number } | null
}

export async function createOrder(input: {
  firstName: string
  lastName: string
  address: string
  lat: number | null
  lng: number | null
  total: number
  items: OrderItem[]
}) {
  // 1) usuario actual
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  if (!user) throw new Error('Debes iniciar sesión para pagar.')

  // 2) insertar orden
  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,            // <--- IMPORTANTE
      first_name: input.firstName,
      last_name:  input.lastName,
      address:    input.address,
      lat:        input.lat,
      lng:        input.lng,
      total:      input.total,
      status:     'NEW'
    })
    .select('id')
    .single()

  if (error) throw error
  const orderId = data.id

  // 3) insertar items (si tienes tabla order_items)
  if (input.items?.length) {
    const rows = input.items.map(it => ({
      order_id:  orderId,
      product_id: it.productId,
      qty:        it.qty,
      unit_price: it.basePrice,
      addition_id: it.addition?.id ?? null,
      drink_id:    it.drink?.id ?? null,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(rows)
    if (itemsErr) throw itemsErr
  }

  return orderId
}
