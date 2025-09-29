export const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v); //Validación para email

export const isNotEmpty = (v: string) => v.trim().length > 0; //Validación para campos vacíos