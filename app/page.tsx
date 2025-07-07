'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
  Shield,
  Clock,
  LogIn,
  TrendingUp,
  Smartphone,
  Cloud,
  Award,
  Users2,
  Target,
  Play,
  Zap,
  DollarSign
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      })
      if (error) console.error('Google sign-up error:', error)
    } catch (error) {
      console.error('Google sign-up error:', error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: 'Smart Work Order Management',
      description: 'Create, assign, and track work orders with real-time updates. Reduce job completion time by 40%.'
    },
    {
      icon: Users,
      title: 'Complete Client Management',
      description: 'Store client details, service history, and preferences. Build lasting relationships and increase repeat business.'
    },
    {
      icon: Package,
      title: 'Service Catalog & Pricing',
      description: 'Create professional service catalogs with dynamic pricing. Increase average order value by 25%.'
    },
    {
      icon: BarChart3,
      title: 'Business Intelligence',
      description: 'Track revenue, analyze performance, and identify growth opportunities with detailed analytics.'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Access everything from the field. Perfect for contractors who work on-site and need real-time updates.'
    },
    {
      icon: Cloud,
      title: 'Cloud-Based & Secure',
      description: 'Enterprise-grade security with automatic backups. Access your data from anywhere, anytime.'
    }
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increase Revenue',
      description: 'Contractors using Effortless see an average 35% increase in monthly revenue'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce administrative tasks by 60% and focus on what you do best'
    },
    {
      icon: Users2,
      title: 'Improve Customer Satisfaction',
      description: 'Professional communication and tracking leads to 90% customer satisfaction'
    },
    {
      icon: Target,
      title: 'Scale Your Business',
      description: 'Handle more jobs with the same team size and grow efficiently'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HVAC Contractor',
      company: 'Johnson Heating & Cooling',
      content: 'Effortless has transformed our business. We went from managing 15 jobs to 45 jobs with the same team size. Revenue increased 40% in the first quarter.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Plumbing Services',
      company: 'Chen Plumbing Co.',
      content: 'The work order system is incredible. Our team can track jobs in real-time, and customers love the professional updates. Setup took less than 30 minutes.',
      rating: 5
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Electrical Contractor',
      company: 'Rodriguez Electric',
      content: 'Finally, a system built for contractors. The mobile app is perfect for field work, and the analytics help us make better business decisions.',
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for small contractors',
      features: [
        'Up to 1,000 work orders/month',
        '3 team members',
        'Basic client management',
        'Mobile app access',
        'Email support',
        'Basic analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$24',
      period: '/month',
      description: 'Most popular for growing businesses',
      features: [
        'Unlimited work orders',
        'Unlimited team members',
        'Advanced analytics',
        'QuickBooks integration',
        'Priority support',
        'Custom branding',
        'Advanced reporting'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$59',
      period: '/month',
      description: 'For large service companies',
      features: [
        'Everything in Professional',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'Advanced automation',
        'Multi-location support'
      ],
      popular: false
    }
  ]

  const faqs = [
    {
      question: 'How long does setup take?',
      answer: 'Most contractors are up and running in under 30 minutes. We provide step-by-step guidance and can import your existing client data.'
    },
    {
      question: 'Can I use this on my phone?',
      answer: 'Absolutely! Effortless is designed mobile-first, so you can manage work orders, update job status, and communicate with clients from anywhere.'
    },
    {
      question: 'What if I need to cancel?',
      answer: 'You can cancel anytime with no penalties. We\'ll help you export your data if needed. No long-term contracts required.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use enterprise-grade security with encryption, regular backups, and compliance with industry standards. Your data is always protected.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Effortless</h1>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="mr-2 h-4 w-4" />
                  Get Started Free
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8">
              <Award className="mr-2 h-4 w-4" />
              Trusted by 500+ Contractors
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Work Order Management
              <span className="block text-blue-600">Made Simple</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your entire operation with the most powerful work order management system. 
              Manage jobs, clients, and payments in one place. Join 500+ contractors who've increased revenue by 35%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={handleGoogleSignUp}
                disabled={googleLoading}
                size="lg"
                className="h-14 text-lg bg-blue-600 hover:bg-blue-700 px-8"
              >
                {googleLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating your account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Get Started Free
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </div>
                )}
              </Button>
              <Link href="/overview">
                <Button size="lg" variant="outline" className="h-14 text-lg border-2 border-gray-300 hover:border-gray-400 px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Free forever plan • No credit card required • Setup in 5 minutes
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                99.9% Uptime
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mobile-First
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Contractors Choose Effortless
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of contractors who've transformed their business with our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Contractors Nationwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about Effortless
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
                    <p className="text-xs text-gray-400">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business. Start with our free plan, upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`border-0 shadow-lg ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => {
                      if (plan.name === 'Free') {
                        handleGoogleSignUp()
                      } else {
                        // Redirect to sign up with plan selection
                        window.location.href = `/auth/register?plan=${plan.name.toLowerCase()}`
                      }
                    }}
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : plan.name === 'Free' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    {plan.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Effortless
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Effortless</h3>
              <p className="text-gray-400 mb-4">
                The complete work order management system for contractors and service businesses.
              </p>
              <div className="flex space-x-4">
                <a href="mailto:support@effortless.com" className="text-gray-400 hover:text-white">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="tel:+1-800-EFFORTLESS" className="text-gray-400 hover:text-white">
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/integrations" className="hover:text-white">Integrations</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Effortless. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
