export function isValidEmail(email: string): boolean {
    const value = email.trim()
    const regex = /\S+@\S+\.\S+/
    return regex.test(value)
}

export type PasswordChecks = {
    lenOk: boolean
    upOk: boolean
    loOk: boolean
    spOk: boolean
    valid: boolean
}

export function getPasswordChecks(password: string): PasswordChecks {
    const lenOk = password.length >= 8
    const upOk = /[A-Z]/.test(password)
    const loOk = /[a-z]/.test(password)
    const spOk = /[^A-Za-z0-9]/.test(password)
    const valid = lenOk && upOk && loOk && spOk

    return { lenOk, upOk, loOk, spOk, valid }
}

export function isValidName(name: string): boolean {
    const value = name.trim()
    const regex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{2,40}$/
    return regex.test(value)
}

export function isValidPhone(phone: string): boolean {
    const value = phone.trim()
    if (!value) return false
    const regex = /^[0-9]{10}$/
    return regex.test(value)
}