export const instant = false;

import Link from 'next/link'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-zinc-900 text-center mb-2">Recuperar Contraseña</h1>
        <p className="text-sm text-zinc-500 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
        <ForgotPasswordForm />
        <div className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-emerald-600 hover:underline font-medium">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}