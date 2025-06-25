import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">nApp</h1>
          <p className="text-xl text-gray-600">Manage your work orders, clients, and services</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Get started by creating an account or signing in to your existing account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/register" className="block">
              <Button className="w-full" size="lg">
                Create Account
              </Button>
            </Link>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Manage your work orders and operations with ease</p>
        </div>
      </div>
    </div>
  )
}
