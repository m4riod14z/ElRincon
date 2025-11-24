import { supabase } from '@/services/SupabaseClient'

export type UserRole = 'client' | 'admin' | 'restaurant'

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('No se encontró el usuario autenticado')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error obteniendo rol:', error.message)
    return null
  }

  return (data?.role as UserRole) || null
}

let cachedRole: UserRole | null | undefined
let rolePromise: Promise<UserRole | null> | null = null

export function clearCachedUserRole() {
  cachedRole = undefined
}

export async function getCachedUserRole(
  forceRefresh = false,
): Promise<UserRole | null> {
  if (!forceRefresh && cachedRole !== undefined) return cachedRole
  if (!forceRefresh && rolePromise) return rolePromise

  rolePromise = getCurrentUserRole()
    .then(role => {
      cachedRole = role
      return role
    })
    .catch(err => {
      cachedRole = undefined
      throw err
    })
    .finally(() => {
      rolePromise = null
    })

  return rolePromise
}

export async function createOrUpdateProfile(payload: {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', payload.id)
    .maybeSingle()

  const role = (existing?.role as UserRole | undefined) ?? 'client'
  const phoneValue = payload.phone?.trim?.() ?? ''

  const { error } = await supabase.from('profiles').upsert(
    {
      id: payload.id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: phoneValue,
      role,
    },
    {
      onConflict: 'id',
    },
  )

  if (error) {
    throw error
  }
}

export async function ensureProfileRow() {
  const { data: ures, error: uerr } = await supabase.auth.getUser()
  if (uerr || !ures.user) return
  const user = ures.user

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        first_name: '',
        last_name: '',
        email: user.email ?? '',
        phone: '',
        role: 'client',
      },
      { onConflict: 'id' },
    )
  }
}