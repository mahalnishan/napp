#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and provides detailed diagnostics
 * for troubleshooting connection issues.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log(`  SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ Missing required environment variables!')
    console.log('Please check your .env.local file.')
    process.exit(1)
  }
  
  console.log('\n🌐 Network Configuration:')
  console.log(`  URL: ${supabaseUrl}`)
  console.log(`  Key Length: ${supabaseAnonKey.length} characters`)
  
  // Create client with timeout
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'database-test-script',
      },
    },
  })
  
  // Test basic connectivity
  console.log('\n🔌 Testing Basic Connectivity...')
  const startTime = Date.now()
  
  try {
    const { data, error } = await Promise.race([
      supabase.from('users').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ])
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`)
      console.log(`   Code: ${error.code}`)
      console.log(`   Details: ${error.details}`)
      console.log(`   Hint: ${error.hint}`)
    } else {
      console.log(`✅ Connection successful!`)
      console.log(`   Response time: ${responseTime}ms`)
      console.log(`   Data received: ${JSON.stringify(data)}`)
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ Connection failed: ${error.message}`)
    console.log(`   Response time: ${responseTime}ms`)
  }
  
  // Test authentication
  console.log('\n🔐 Testing Authentication...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log(`⚠️  Authentication check: ${error.message}`)
      console.log('   This is normal if no user is logged in')
    } else {
      console.log(`✅ Authentication working`)
      console.log(`   User: ${user ? user.email : 'None'}`)
    }
  } catch (error) {
    console.log(`❌ Authentication failed: ${error.message}`)
  }
  
  // Test RLS policies
  console.log('\n🛡️  Testing Row Level Security...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(5)
    
    if (error) {
      console.log(`❌ RLS test failed: ${error.message}`)
      console.log(`   This might indicate RLS policy issues`)
    } else {
      console.log(`✅ RLS working correctly`)
      console.log(`   Retrieved ${data?.length || 0} records`)
    }
  } catch (error) {
    console.log(`❌ RLS test error: ${error.message}`)
  }
  
  // Performance test
  console.log('\n⚡ Performance Test...')
  const performanceTests = []
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now()
    try {
      await supabase.from('users').select('count').limit(1)
      const duration = Date.now() - start
      performanceTests.push(duration)
      console.log(`   Test ${i + 1}: ${duration}ms`)
    } catch (error) {
      console.log(`   Test ${i + 1}: Failed - ${error.message}`)
    }
  }
  
  if (performanceTests.length > 0) {
    const avg = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length
    console.log(`   Average response time: ${Math.round(avg)}ms`)
  }
  
  console.log('\n📊 Summary:')
  console.log('   - Check the results above for any ❌ errors')
  console.log('   - Response times under 1000ms are good')
  console.log('   - If you see connection timeouts, check your network')
  console.log('   - If you see RLS errors, check your database policies')
  console.log('\n🔧 Troubleshooting Tips:')
  console.log('   1. Check your internet connection')
  console.log('   2. Verify your Supabase project is active')
  console.log('   3. Check your environment variables')
  console.log('   4. Review your database RLS policies')
  console.log('   5. Check Supabase status page for outages')
}

// Run the test
testDatabaseConnection().catch(error => {
  console.error('❌ Test script failed:', error)
  process.exit(1)
}) 