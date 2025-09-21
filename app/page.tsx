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
    } catch (error) {
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
      description: 'Contractors using DotOrder.app see an average 35% increase in monthly revenue'
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
      content: 'DotOrder.app has transformed our business. We went from managing 15 jobs to 45 jobs with the same team size. Revenue increased 40% in the first quarter.',
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
        'QuickBooks integration (Coming Soon)',
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
      answer: 'Absolutely! DotOrder.app is designed mobile-first, so you can manage work orders, update job status, and communicate with clients from anywhere.'
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
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Blue gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <h1 className="text-2xl font-bold text-white">DotOrder.app</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#hero" className="text-gray-300 hover:text-white transition-colors">Home</a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
            </nav>
            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* User Count */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="ml-3 text-gray-300 text-sm">500+ Contractors</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Work Order Management
              <span className="block text-blue-400 italic">Made Simple</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
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
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
              <Button size="lg" variant="outline" className="h-14 text-lg border-2 border-gray-600 hover:border-gray-500 text-blue hover:bg-white-800 px-8">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-white font-semibold">DotOrder.app</span>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-gray-700 rounded-lg px-3 py-2">
                      <span className="text-gray-300 text-sm">Q Search</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">6</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-4 bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-xs text-white">🇬🇧</span>
                    </div>
                    <span className="text-gray-300 text-sm">English</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="text-white text-sm font-medium">Moni Roy</div>
                      <div className="text-gray-400 text-xs">Admin</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 bg-gray-800 border-r border-gray-700">
                <nav className="p-4 space-y-2">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    Dashboard
                  </div>
                  <div className="text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg cursor-pointer">
                    Work Orders
                  </div>
                  <div className="text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg cursor-pointer">
                    Clients
                  </div>
                  <div className="text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg cursor-pointer">
                    Services
                  </div>
                  <div className="text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg cursor-pointer">
                    Analytics
                  </div>
                  <div className="text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg cursor-pointer">
                    Settings
                  </div>
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">1,247</div>
                    <div className="text-sm text-gray-400 mb-1">Active Jobs</div>
                    <div className="text-sm text-green-400">12.5% Up from last month</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">892</div>
                    <div className="text-sm text-gray-400 mb-1">Total Clients</div>
                    <div className="text-sm text-green-400">8.3% Up from last month</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$45,230</div>
                    <div className="text-sm text-gray-400 mb-1">Monthly Revenue</div>
                    <div className="text-sm text-green-400">35% Up from last month</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">156</div>
                    <div className="text-sm text-gray-400 mb-1">Pending Orders</div>
                    <div className="text-sm text-red-400">5.2% Down from yesterday</div>
                  </div>
                </div>

                {/* Work Orders Overview Section */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Work Orders Overview</h3>
                    <div className="flex items-center space-x-2">
                      <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600">
                        <option>This Month</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Work order analytics chart would go here</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful features designed specifically for contractors and service businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Built for Contractors, by Contractors
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                We understand the challenges contractors face every day. That's why we built DotOrder.app 
                with real-world experience and feedback from hundreds of service professionals.
              </p>
              <p className="text-lg text-gray-300 mb-8">
                Our mission is simple: help you manage more jobs, serve more clients, and grow your business 
                without the administrative headaches.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
                  <div className="text-gray-300">Active Contractors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">35%</div>
                  <div className="text-gray-300">Average Revenue Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">60%</div>
                  <div className="text-gray-300">Time Saved on Admin</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">90%</div>
                  <div className="text-gray-300">Customer Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Why Contractors Choose Us</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Mobile-First Design</h4>
                    <p className="text-gray-300 text-sm">Access everything from the field with our responsive mobile app</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Quick Setup</h4>
                    <p className="text-gray-300 text-sm">Get up and running in under 30 minutes with our guided setup</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">24/7 Support</h4>
                    <p className="text-gray-300 text-sm">Get help when you need it with our dedicated support team</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Secure & Reliable</h4>
                    <p className="text-gray-300 text-sm">Enterprise-grade security with 99.9% uptime guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the plan that fits your business. Start with our free plan, upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-gray-900 rounded-2xl p-8 border ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'} hover:border-gray-600 transition-colors`}>
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium rounded-lg mb-6 -mt-8">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-300">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => {
                    if (plan.name === 'Free') {
                      handleGoogleSignUp()
                    } else {
                      window.location.href = `/auth/register?plan=${plan.name.toLowerCase()}`
                    }
                  }}
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : plan.name === 'Free' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {plan.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to know about DotOrder.app
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
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
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <h3 className="text-2xl font-bold">DotOrder.app</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The complete work order management system for contractors and service businesses. 
                Streamline your entire operation with powerful tools designed for growth.
              </p>
              <div className="flex space-x-4">
                <a href="mailto:support@dotorder.app" className="text-gray-400 hover:text-white">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="tel:+1-800-DOTORDER" className="text-gray-400 hover:text-white">
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
            <p>&copy; 2024 DotOrder.app. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
