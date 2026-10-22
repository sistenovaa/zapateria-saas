export const instant = false;

import { UpdatePasswordForm } from './UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-zinc-900 text-center mb-2">Nueva Contraseña</h1>
        <p className="text-sm text-zinc-500 text-center mb-6">
          Ingresa tu nueva contraseña para acceder a tu cuenta.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  )
}