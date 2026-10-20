'use client'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// Función para mostrar errores (traduce automáticamente errores comunes de Supabase)
export const showError = (message: string) => {
  let title = '¡Ups! Algo salió mal'
  let text = message

  // Traducción de errores comunes de Supabase
  if (message.includes('Invalid login credentials')) {
    title = 'Credenciales incorrectas'
    text = 'El correo o la contraseña son incorrectos. Por favor, verifica e intenta de nuevo.'
  } else if (message.includes('User already registered')) {
    title = 'Correo ya registrado'
    text = 'Ya existe una cuenta con este correo. Intenta iniciar sesión.'
  } else if (message.includes('Password should be at least')) {
    title = 'Contraseña muy corta'
    text = 'La contraseña debe tener al menos 6 caracteres.'
  } else if (message.includes('Email not confirmed')) {
    title = 'Correo no confirmado'
    text = 'Por favor, revisa tu bandeja de entrada y confirma tu correo.'
  } else if (message.includes('rate limit')) {
    title = 'Demasiados intentos'
    text = 'Has intentado muchas veces. Por favor, espera un momento antes de volver a intentar.'
  }

  MySwal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: '#10b981', // Verde esmeralda
    confirmButtonText: 'Entendido'
  })
}

// Función para mostrar éxito
export const showSuccess = (title: string, text?: string) => {
  MySwal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Genial'
  })
}