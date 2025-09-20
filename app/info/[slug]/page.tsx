import Link from 'next/link'
import { notFound } from 'next/navigation'

const pages: Record<string, { title: string; subtitle?: string; sections: { heading: string; body: string }[] }> = {
  product: {
    title: 'DotOrder.app - Complete Work Order Management',
    subtitle: 'The all-in-one platform that transforms how contractors and service businesses manage their operations',
    sections: [
      {
        heading: 'What is DotOrder.app?',
        body: 'DotOrder.app is a comprehensive work order management system designed specifically for contractors, service businesses, and field technicians. We eliminate the chaos of spreadsheets, paper forms, and disconnected systems by providing everything you need in one powerful, mobile-first platform.'
      },
      {
        heading: 'Why Contractors Choose DotOrder.app',
        body: 'Traditional methods of managing work orders are time-consuming and error-prone. DotOrder.app streamlines your entire workflow from job creation to payment collection. Our platform helps contractors increase revenue by 35% on average while reducing administrative overhead by 60%.'
      },
      {
        heading: 'Core Platform Features',
        body: '• Smart Work Order Management: Create, assign, and track jobs with real-time updates\n• Complete Client CRM: Store contact history, service preferences, and invoicing in one place\n• Service Catalog & Pricing: Standardize services with dynamic pricing and easy quoting\n• Business Intelligence: Track revenue, analyze performance, and identify growth opportunities\n• Mobile-First Design: Access everything from the field with our responsive mobile app\n• Cloud-Based Security: Enterprise-grade security with automatic backups and data protection'
      },
      {
        heading: 'Who Uses DotOrder.app?',
        body: 'HVAC contractors, plumbers, electricians, landscapers, cleaning services, maintenance companies, and any service business that needs to manage work orders, clients, and invoicing efficiently. Our platform scales from solo contractors to multi-location service companies.'
      }
    ]
  },
  features: {
    title: 'Powerful Features for Service Businesses',
    subtitle: 'Everything you need to run your service business efficiently - nothing you don\'t',
    sections: [
      {
        heading: 'Smart Work Order Management',
        body: 'Create professional work orders in seconds with our intuitive interface. Assign jobs to team members, set priorities, add photos and notes, and track progress in real-time. Automatic notifications keep clients informed about job status, reducing follow-up calls by 80%.'
      },
      {
        heading: 'Complete Client Management',
        body: 'Build lasting relationships with comprehensive client profiles. Store contact information, service history, preferences, and payment methods. Track communication history and automatically log all interactions. Our CRM helps you provide personalized service and increase repeat business.'
      },
      {
        heading: 'Service Catalog & Dynamic Pricing',
        body: 'Create a professional service catalog with standardized pricing and descriptions. Set up dynamic pricing based on location, time of day, or customer type. Generate quotes instantly and convert them to work orders with one click. Increase average order value by 25% with strategic upselling.'
      },
      {
        heading: 'Real-Time Analytics & Reporting',
        body: 'Make data-driven decisions with comprehensive analytics. Track revenue trends, job completion times, team performance, and customer satisfaction. Identify your most profitable services and top-performing team members. Export reports for accounting and business planning.'
      },
      {
        heading: 'Mobile-First Field Operations',
        body: 'Perfect for contractors who work on-site. Update job status, add photos, capture signatures, and communicate with clients from anywhere. Offline capability ensures you can work even without internet connectivity. GPS tracking helps optimize routes and improve efficiency.'
      },
      {
        heading: 'Seamless Integrations',
        body: 'Connect with the tools you already use. Stripe integration provides secure online payments and customer billing portals. QuickBooks integration coming soon! Zapier connections let you automate workflows with 5,000+ apps.'
      },
      {
        heading: 'Team Management & Collaboration',
        body: 'Manage your entire team from one dashboard. Assign roles and permissions, track time and attendance, and monitor performance. Team members can update job status, add notes, and communicate with clients while maintaining professional standards.'
      },
      {
        heading: 'Advanced Automation',
        body: 'Automate repetitive tasks to save time and reduce errors. Set up automatic follow-ups, payment reminders, and status updates. Create custom workflows for different service types. Schedule recurring maintenance jobs and seasonal services.'
      }
    ]
  },
  pricing: {
    title: 'Simple, Transparent Pricing',
    subtitle: 'Start free, scale as you grow. No hidden fees, no long-term contracts.',
    sections: [
      {
        heading: 'Free Plan - $0/month',
        body: 'Perfect for solo contractors and small businesses getting started.\n\n• Up to 1,000 work orders per month\n• 3 team members\n• Basic client management\n• Mobile app access\n• Email support\n• Basic analytics and reporting\n• Standard integrations\n\nStart free today with no credit card required.'
      },
      {
        heading: 'Professional Plan - $24/month',
        body: 'Most popular choice for growing service businesses.\n\n• Unlimited work orders\n• Unlimited team members\n• Advanced analytics and reporting\n• QuickBooks integration (Coming Soon)\n• Stripe payment processing\n• Priority email and chat support\n• Custom branding options\n• Advanced automation features\n• API access\n• Multi-location support\n\nEverything you need to scale your business efficiently.'
      },
      {
        heading: 'Enterprise Plan - $59/month',
        body: 'For large service companies and multi-location operations.\n\n• Everything in Professional\n• Dedicated account manager\n• Custom integrations and white-label options\n• Advanced workflow automation\n• Advanced security features\n• Phone support with 4-hour response time\n• Custom training and onboarding\n• Advanced reporting and analytics\n• Multi-currency support\n• Advanced team management features\n\nEnterprise-grade features for complex operations.'
      },
      {
        heading: 'Additional Services',
        body: '• Data migration assistance: $199 one-time fee\n• Custom integration development: Starting at $500\n• White-label solutions: Custom pricing\n• Training and consulting: $150/hour\n• Priority support upgrades: $50/month\n\nAll plans include a 30-day free trial. Cancel anytime with no penalties.'
      }
    ]
  },
  integrations: {
    title: 'Powerful Integrations',
    subtitle: 'Connect DotOrder.app with the tools you already use and love',
    sections: [
      {
        heading: 'QuickBooks Integration (Coming Soon)',
        body: 'We\'re working on seamless integration with QuickBooks Online and QuickBooks Desktop. This will automatically sync customers, services, and invoices. Sync payments and maintain accurate financial records. Reduce double-entry and eliminate reconciliation headaches. Stay tuned for updates!'
      },
      {
        heading: 'Stripe Payment Processing',
        body: 'Accept online payments securely with Stripe integration. Send professional invoices with payment links. Offer customer billing portals for self-service payments. Process credit cards, ACH transfers, and digital wallets. Automatic payment reconciliation saves hours each month.'
      },
      {
        heading: 'Zapier & Webhook Automation',
        body: 'Connect DotOrder.app to over 5,000 apps through Zapier. Automate workflows with popular tools like Gmail, Slack, Trello, and more. Use webhooks to build custom integrations with your existing systems. Create powerful automations that save time and reduce manual work.'
      },
      {
        heading: 'Calendar & Scheduling',
        body: 'Sync with Google Calendar, Outlook, and other calendar systems. Schedule jobs automatically based on availability. Send calendar invites to clients and team members. Block out unavailable times and optimize scheduling for maximum efficiency.'
      },
      {
        heading: 'Communication Tools',
        body: 'Integrate with your preferred communication tools. Send SMS notifications through Twilio. Connect with Slack for team notifications. Integrate with email marketing platforms for customer communications. Keep everyone informed without switching between apps.'
      },
      {
        heading: 'Accounting & Tax Software',
        body: 'Beyond QuickBooks, connect with Xero, FreshBooks, and other accounting platforms. Export data for tax preparation software. Generate reports for accountants and bookkeepers. Maintain compliance with automated data synchronization.'
      }
    ]
  },
  api: {
    title: 'Developer API & Integrations',
    subtitle: 'Build powerful integrations and automate your workflows',
    sections: [
      {
        heading: 'RESTful API',
        body: 'Access all DotOrder.app functionality through our comprehensive REST API. Create and manage work orders, clients, services, and invoices programmatically. Query analytics data and generate custom reports. Perfect for building custom integrations or connecting with existing systems.'
      },
      {
        heading: 'Authentication & Security',
        body: 'Secure API access using JWT tokens from Supabase Auth. Role-based permissions ensure data security. API keys with granular permissions for different integration needs. Rate limiting and monitoring to ensure reliable performance.'
      },
      {
        heading: 'Webhooks & Real-Time Updates',
        body: 'Receive real-time notifications when data changes in DotOrder.app. Webhooks for work order status changes, new clients, payments, and more. Build reactive integrations that respond to events automatically. Reduce polling and improve integration efficiency.'
      },
      {
        heading: 'SDKs & Libraries',
        body: 'Official SDKs for popular programming languages including JavaScript, Python, and PHP. Comprehensive documentation with code examples. Community-contributed libraries and integrations. Quick start guides for common use cases.'
      },
      {
        heading: 'API Documentation',
        body: 'Complete API reference with interactive examples. Postman collection for testing endpoints. OpenAPI specification for code generation. Detailed guides for common integration patterns. Developer support for complex integrations.'
      },
      {
        heading: 'Use Cases & Examples',
        body: '• Custom mobile apps for field technicians\n• Integration with existing CRM systems\n• Automated reporting and analytics\n• Custom billing and invoicing workflows\n• Third-party scheduling systems\n• Equipment and inventory management\n• Customer portal development'
      }
    ]
  },
  company: {
    title: 'About Our Company',
    subtitle: 'Building the future of service business management',
    sections: [
      {
        heading: 'Our Mission',
        body: 'We\'re on a mission to empower service businesses with technology that makes their work effortless. We believe that contractors and service professionals should spend their time doing what they do best - serving customers - not wrestling with paperwork and administrative tasks.'
      },
      {
        heading: 'Our Story',
        body: 'DotOrder.app was founded by a team of experienced contractors and software engineers who were frustrated by the lack of good tools for service businesses. We built the platform we wished we had when running our own service companies. Today, we serve thousands of contractors across North America.'
      },
      {
        heading: 'Our Values',
        body: '• Customer Success: We measure our success by our customers\' success\n• Simplicity: We believe powerful software should be easy to use\n• Reliability: Service businesses depend on us, so we prioritize stability\n• Innovation: We continuously improve based on customer feedback\n• Transparency: Honest pricing, clear communication, and open development'
      },
      {
        heading: 'Our Team',
        body: 'We\'re a remote-first team of experienced SaaS founders, field service veterans, and software engineers. Our diverse backgrounds give us unique insights into the challenges service businesses face. We\'re passionate about building tools that make a real difference.'
      },
      {
        heading: 'Our Commitment',
        body: 'We\'re committed to the long-term success of service businesses. That means building lasting relationships, providing exceptional support, and continuously improving our platform based on real customer needs. We\'re here for the long haul.'
      }
    ]
  },
  about: {
    title: 'About DotOrder.app',
    subtitle: 'The complete story behind the platform that\'s transforming service businesses',
    sections: [
      {
        heading: 'How It All Started',
        body: 'The idea for DotOrder.app came from real frustration. Our founders were running successful service businesses but spending more time on paperwork than actual work. Spreadsheets were getting out of control, follow-ups were falling through the cracks, and we knew there had to be a better way.'
      },
      {
        heading: 'The Problem We Solved',
        body: 'Service businesses were stuck using tools designed for other industries or trying to make generic software work for their specific needs. We saw contractors using everything from paper forms to complex ERP systems, but nothing that truly understood the unique challenges of field service work.'
      },
      {
        heading: 'Building the Solution',
        body: 'We started by talking to hundreds of contractors, understanding their workflows, and identifying the biggest pain points. We built DotOrder.app from the ground up specifically for service businesses, with mobile-first design and real-world usability in mind.'
      },
      {
        heading: 'Our Growth',
        body: 'What started as a solution for a few local contractors has grown into a platform serving thousands of service businesses across North America. We\'ve helped contractors increase their revenue, reduce administrative overhead, and provide better service to their customers.'
      },
      {
        heading: 'Looking Forward',
        body: 'We\'re just getting started. We continue to innovate based on customer feedback, adding new features and integrations that make service businesses even more efficient. Our goal is to become the standard platform that every service business uses to manage their operations.'
      },
      {
        heading: 'Join Our Journey',
        body: 'Whether you\'re a solo contractor or running a multi-location service company, we invite you to join thousands of other service professionals who have transformed their businesses with DotOrder.app. Let\'s build the future of service business management together.'
      }
    ]
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we protect and handle your data',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes contact information, business details, work order data, client information, and payment information. We also collect usage data to improve our services.'
      },
      {
        heading: 'How We Use Your Information',
        body: 'We use your information to provide, maintain, and improve our services; process transactions; send you technical notices and support messages; respond to your comments and questions; and communicate with you about products, services, and events.'
      },
      {
        heading: 'Information Sharing',
        body: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with service providers who assist us in operating our platform, conducting business, or servicing you.'
      },
      {
        heading: 'Data Security',
        body: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption at rest and in transit, regular security assessments, and access controls.'
      },
      {
        heading: 'Data Retention',
        body: 'We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. We may retain certain information for legal, regulatory, or business purposes.'
      },
      {
        heading: 'Your Rights',
        body: 'You have the right to access, correct, or delete your personal information. You can manage your account settings and preferences through our platform. You may also contact us to exercise these rights or to opt out of certain communications.'
      },
      {
        heading: 'Cookies and Tracking',
        body: 'We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences. We do not use cookies for advertising purposes.'
      },
      {
        heading: 'Updates to This Policy',
        body: 'We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the effective date. Your continued use of our services constitutes acceptance of the updated policy.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'The legal agreement between you and DotOrder.app',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By accessing or using DotOrder.app, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our service. These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.'
      },
      {
        heading: 'Description of Service',
        body: 'DotOrder.app provides work order management software for service businesses. Our platform includes features for creating and managing work orders, client management, invoicing, analytics, and related business operations. We reserve the right to modify or discontinue any part of our service at any time.'
      },
      {
        heading: 'User Accounts',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. You may not share your account credentials with others or allow others to access your account.'
      },
      {
        heading: 'Acceptable Use',
        body: 'You agree to use our service only for lawful purposes and in accordance with these terms. You may not use our service to transmit any material that is defamatory, offensive, or otherwise objectionable. You may not attempt to gain unauthorized access to our systems or interfere with the proper working of our service.'
      },
      {
        heading: 'Payment Terms',
        body: 'Paid plans are billed on a monthly or annual basis. You authorize us to charge your payment method for all fees associated with your plan. Prices may change with 30 days notice. You may cancel your subscription at any time, and you will not be charged for subsequent billing periods.'
      },
      {
        heading: 'Data and Privacy',
        body: 'You retain ownership of all data you submit to our service. We process your data in accordance with our Privacy Policy. You are responsible for ensuring you have the right to share any data you upload to our service and for complying with applicable data protection laws.'
      },
      {
        heading: 'Intellectual Property',
        body: 'Our service and its original content, features, and functionality are owned by DotOrder.app and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, or distribute our software without permission.'
      },
      {
        heading: 'Limitation of Liability',
        body: 'In no event shall DotOrder.app be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our service.'
      },
      {
        heading: 'Termination',
        body: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties. Upon termination, your right to use the service will cease immediately.'
      },
      {
        heading: 'Governing Law',
        body: 'These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which DotOrder.app operates, without regard to its conflict of law provisions. Any disputes arising from these terms will be resolved in the appropriate courts of that jurisdiction.'
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'We\'d love to hear from you. Get in touch with our team.',
    sections: [
      {
        heading: 'Customer Support',
        body: 'Need help with your account or have questions about our platform?\n\nEmail: support@dotorder.app\nResponse time: Within 24 hours\n\nFor urgent issues, please include your account details and a clear description of the problem.'
      },
      {
        heading: 'Sales Inquiries',
        body: 'Interested in DotOrder.app for your business or have questions about our plans?\n\nEmail: sales@dotorder.app\nPhone: 1-800-DOTORDER\n\nOur sales team can help you choose the right plan and get you set up quickly.'
      },
      {
        heading: 'Partnership Opportunities',
        body: 'Looking to integrate with DotOrder.app or become a partner?\n\nEmail: partnerships@dotorder.app\n\nWe\'re always interested in working with complementary service providers and technology partners.'
      },
      {
        heading: 'Technical Support',
        body: 'Need help with API integration or technical implementation?\n\nEmail: developers@dotorder.app\nDocumentation: https://docs.dotorder.app\n\nOur technical team can help with custom integrations and development questions.'
      },
      {
        heading: 'General Inquiries',
        body: 'For all other questions or feedback:\n\nEmail: hello@dotorder.app\n\nWe read every message and will get back to you as soon as possible.'
      },
      {
        heading: 'Office Hours',
        body: 'Monday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 2:00 PM EST\nSunday: Closed\n\nEmergency support is available 24/7 for critical issues affecting your business operations.'
      },
      {
        heading: 'Mailing Address',
        body: 'DotOrder.app Inc.\n123 Business Street\nSuite 100\nCity, State 12345\nUnited States\n\nFor legal notices or formal correspondence only.'
      }
    ]
  }
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = pages[slug]
  if (!page) return notFound()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{page.title}</h1>
                    {page.subtitle && <p className="text-xl text-gray-600">{page.subtitle}</p>}
      </header>

      {page.sections.map((sec) => (
        <section key={sec.heading} className="space-y-4">
          <h2 className="text-2xl font-bold">{sec.heading}</h2>
                      <p className="text-gray-700 whitespace-pre-wrap">{sec.body}</p>
        </section>
      ))}

      <footer className="mt-16 text-center text-sm text-gray-500">
        <Link href="/">← Back to Home</Link>
      </footer>
    </div>
  )
} 