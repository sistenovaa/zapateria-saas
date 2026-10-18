import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default async function RegisterPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <p className="text-sm text-zinc-500 text-center">Comienza a gestionar tu zapatería</p>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
            <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" required />
            <Input label="Contraseña" name="password" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} />
            
            {searchParams?.message && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                {searchParams.message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2">Registrarme</Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}