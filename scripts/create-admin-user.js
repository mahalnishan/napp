#!/usr/bin/env node

/**
 * Script to create an admin user
 * This script helps you promote an existing user to admin role
 */

const { createClient } = require('@supabase/supabase-js')

// Read environment variables from .env.local
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env.local')
let supabaseUrl, supabaseServiceKey

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1]
    }
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('🔍 Looking for existing users...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found. Please create a user account first through the registration page.')
      return
    }

    console.log('\n📋 Available users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - Role: ${user.role || 'user'}`)
    })

    // For this script, we'll just update the first user to admin
    // In a real scenario, you might want to prompt for which user to make admin
    const userToUpdate = users[0]
    
    if (userToUpdate.role === 'admin') {
      console.log(`\n✅ User ${userToUpdate.email} is already an admin!`)
      return
    }

    console.log(`\n🔄 Updating ${userToUpdate.email} to admin role...`)

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userToUpdate.id)

    if (updateError) {
      console.error('❌ Error updating user role:', updateError.message)
      return
    }

    console.log(`\n✅ Successfully updated ${userToUpdate.email} to admin role!`)
    console.log('\n🎉 You can now access the admin panel at /admin')
    console.log('   Make sure to log out and log back in to refresh your session.')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createAdminUser()
