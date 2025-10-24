import { supabase } from '@/services/SupabaseClient'

export type CartAddition = { id: number; name: string; price: number }
export type CartDrink    = { id: number; name: string; price: number }

export type CartItem = {
  productId: number
  name: string
  basePrice: number
  qty: number
  addition?: CartAddition | null
  drink?: CartDrink | null
}

export type AvailabilityIssue =
  | { kind: 'product';  id: number; name?: string }
  | { kind: 'addition'; id: number; name?: string }
  | { kind: 'drink';    id: number; name?: string }

/**
 * Valida disponibilidad de los items del carrito.
 * Devuelve un arreglo de problemas. Si está vacío => todo ok.
 */
export async function validateAvailability(items: CartItem[]) {
  const prodIds   = [...new Set(items.map(i => i.productId))]
  const addIds    = [...new Set(items.map(i => i.addition?.id).filter(Boolean))] as number[]
  const drinkIds  = [...new Set(items.map(i => i.drink?.id).filter(Boolean))] as number[]

  const issues: AvailabilityIssue[] = []

  if (prodIds.length) {
    const { data } = await supabase.from('products').select('id,name,available').in('id', prodIds)
    const map = new Map((data ?? []).map(r => [r.id, r]))
    for (const id of prodIds) {
      const r = map.get(id)
      if (!r || !r.available) issues.push({ kind: 'product', id, name: r?.name })
    }
  }

  if (addIds.length) {
    const { data } = await supabase.from('additions').select('id,name,available').in('id', addIds)
    const map = new Map((data ?? []).map(r => [r.id, r]))
    for (const id of addIds) {
      const r = map.get(id)
      if (!r || !r.available) issues.push({ kind: 'addition', id, name: r?.name })
    }
  }

  if (drinkIds.length) {
    const { data } = await supabase.from('drinks').select('id,name,available').in('id', drinkIds)
    const map = new Map((data ?? []).map(r => [r.id, r]))
    for (const id of drinkIds) {
      const r = map.get(id)
      if (!r || !r.available) issues.push({ kind: 'drink', id, name: r?.name })
    }
  }

  return issues
}
