#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 Environment Setup Helper')
console.log('==========================\n')

const envPath = path.join(process.cwd(), '.env.local')

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!')
  console.log('Please create a .env.local file in your project root with the following variables:\n')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key')
  console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000')
  process.exit(1)
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8')

// Check for missing variables
const missingVars = []
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL'
]

requiredVars.forEach(varName => {
  if (!envContent.includes(`${varName}=`)) {
    missingVars.push(varName)
  }
})

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set!')
  process.exit(0)
}

console.log('⚠️  Missing environment variables detected:')
missingVars.forEach(varName => console.log(`   - ${varName}`))

console.log('\n📋 To get your Supabase credentials:')
console.log('1. Go to your Supabase project dashboard')
console.log('2. Navigate to Settings > API')
console.log('3. Copy the following values:')
console.log('   - Project URL → NEXT_PUBLIC_SUPABASE_URL')
console.log('   - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('   - service_role → SUPABASE_SERVICE_ROLE_KEY')

console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard')

if (missingVars.includes('SUPABASE_SERVICE_ROLE_KEY')) {
  console.log('\n⚠️  IMPORTANT: The SUPABASE_SERVICE_ROLE_KEY is required for:')
  console.log('   - Account deletion functionality')
  console.log('   - Subscription management')
  console.log('   - Admin operations')
  console.log('\n   This key has admin privileges, so keep it secure!')
}

console.log('\n📝 Add the missing variables to your .env.local file and restart your development server.') 