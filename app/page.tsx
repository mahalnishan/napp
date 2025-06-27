'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Mail,
  Phone,
  MapPin,
  Building2,
  Zap,
  Shield,
  Clock,
  LogIn
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Store email in localStorage for now (you can replace with Supabase later)
      localStorage.setItem('beta-access-email', email)
      
      setSubmitted(true)
      setEmail('')
    } catch (error) {
      console.error('Error submitting email:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: 'Work Order Management',
      description: 'Create, track, and manage work orders with ease. Assign to workers and track progress in real-time.'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Keep all your client information organized. Store contact details, addresses, and service history.'
    },
    {
      icon: Package,
      title: 'Service Catalog',
      description: 'Create a catalog of your services with pricing. Link to QuickBooks for seamless invoicing.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Get insights into your business performance with detailed analytics and revenue tracking.'
    },
    {
      icon: Zap,
      title: 'QuickBooks Integration',
      description: 'Automatically create invoices in QuickBooks when orders are completed. Sync payment status.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with Supabase. Your data is protected and backed up automatically.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HVAC Contractor',
      content: 'nApp has streamlined our entire operation. We can now track jobs from start to finish without any confusion.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Plumbing Services',
      content: 'The QuickBooks integration is a game-changer. Invoices are created automatically and payments sync perfectly.',
      rating: 5
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Electrical Contractor',
      content: 'Finally, a work order system that actually works for contractors. The mobile interface is perfect for field work.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header with Login/Signup */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">nApp</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Beta Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 animate-pulse">
              <Star className="mr-2 h-4 w-4" />
              Now in Beta – 100% Free Access
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Streamline Your Work Orders
              <span className="block text-blue-600">Like Never Before</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The complete work order management system for contractors and service businesses. 
              Manage clients, schedule jobs, track payments, and grow your business with ease.
            </p>

            {/* Email Capture Form */}
            {!submitted ? (
              <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? 'Submitting...' : (
                      <>
                        Get Free Early Access
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="max-w-md mx-auto mb-8">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <CheckCircle className="inline mr-2 h-4 w-4" />
                  Thanks! We'll notify you when your account is ready.
                </div>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for contractors and service businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Contractors Nationwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our early users are saying about nApp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the beta and get free access to all features. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">nApp</h3>
              <p className="text-gray-400 mb-4">
                The complete work order management system for contractors and service businesses.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 nApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
