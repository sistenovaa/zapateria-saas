export const instant = false;

import { Suspense } from 'react'
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md h-[400px] flex items-center justify-center bg-white rounded-xl shadow-sm border border-zinc-200">
          <p className="text-zinc-500 animate-pulse">Cargando formulario...</p>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}