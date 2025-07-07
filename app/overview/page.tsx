import Link from 'next/link'
import { BarChart, CheckCircle, Database, Settings, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Effortless – Product Overview',
  description: "Quick tour of the platform's key benefits and architecture."
}

export default function ProductOverviewPage () {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Work-order management made&nbsp;simple
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Effortless combines a delightful user dashboard with a powerful admin portal—integrated with
          QuickBooks, Stripe, and Supabase—for a truly end-to-end solution.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/auth/register">Try it now</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="mailto:sales@example.com">Book a demo</Link>
          </Button>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart className="h-6 w-6 text-indigo-600" />
            <CardTitle>Real-time analytics</CardTitle>
            <CardDescription>Interactive charts keep you on top of revenue &amp; usage.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Live Postgres replication powers instant updates without extra setup.
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="h-6 w-6 text-indigo-600" />
            <CardTitle>User-friendly dashboard</CardTitle>
            <CardDescription>Customers manage orders, clients, and services in seconds.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Tailwind-powered UI ensures a smooth, accessible experience on any device.
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Settings className="h-6 w-6 text-indigo-600" />
            <CardTitle>Admin control center</CardTitle>
            <CardDescription>Fine-tune settings, API keys, logs and more—role-based secured.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Supabase Row-Level-Security and custom roles keep data locked down.
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Database className="h-6 w-6 text-indigo-600" />
            <CardTitle>Plug-and-play integrations</CardTitle>
            <CardDescription>QuickBooks &amp; Stripe wired in out-of-the-box.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Automate invoicing, billing, and accounting with minimal configuration.
          </CardContent>
        </Card>
      </section>

      {/* Simple architecture illustration */}
      <section className="mt-24 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">How it all connects</h2>
        <div className="relative bg-white shadow rounded-lg p-8">
          <svg viewBox="0 0 400 170" className="w-full h-auto text-gray-700">
            {/* User Dashboard */}
            <rect x="20" y="30" width="120" height="50" rx="8" fill="#EEF2FF" />
            <text x="80" y="60" textAnchor="middle" fontSize="12" fill="#4338CA">User Dashboard</text>

            {/* Admin Portal */}
            <rect x="20" y="100" width="120" height="50" rx="8" fill="#EEF2FF" />
            <text x="80" y="130" textAnchor="middle" fontSize="12" fill="#4338CA">Admin Portal</text>

            {/* Supabase */}
            <rect x="260" y="65" width="120" height="50" rx="8" fill="#DBEAFE" />
            <text x="320" y="95" textAnchor="middle" fontSize="12" fill="#1E3A8A">Supabase</text>

            {/* Arrows */}
            <line x1="140" y1="55" x2="260" y2="90" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="140" y1="125" x2="260" y2="95" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* defs for arrowhead */}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0 0 L6 3 L0 6 Z" fill="#9CA3AF" />
              </marker>
            </defs>
          </svg>
          <p className="mt-4 text-sm text-gray-500">Both dashboards talk to the same real-time database, keeping everyone in sync.</p>
        </div>
      </section>
    </div>
  )
} 