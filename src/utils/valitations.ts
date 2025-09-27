export const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

export const isStrongPassword = (pw: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);