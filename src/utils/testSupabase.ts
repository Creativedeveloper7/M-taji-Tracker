import { supabase } from '../lib/supabase'

/**
 * Test Supabase connection and basic operations
 * Run this in browser console or call from a component
 */
export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...\n')

  // Test 1: Check if Supabase client is initialized
  console.log('1️⃣ Checking Supabase client...')
  if (!supabase) {
    console.error('❌ Supabase client is not initialized')
    return false
  }
  console.log('✅ Supabase client initialized')

  // Test 2: Check environment variables
  console.log('\n2️⃣ Checking environment variables...')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.error('❌ VITE_SUPABASE_URL (or PUBLIC_SUPABASE_URL) is not set or is placeholder')
    console.log('   Please set VITE_SUPABASE_URL in your .env file')
    return false
  }
  if (!supabaseKey || supabaseKey === 'your_supabase_anon_key') {
    console.error('❌ VITE_SUPABASE_ANON_KEY (or PUBLIC_SUPABASE_ANON_KEY) is not set or is placeholder')
    console.log('   Please set VITE_SUPABASE_ANON_KEY in your .env file')
    return false
  }
  console.log('✅ Environment variables are set')
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)

  // Test 3: Test database connection - fetch changemakers
  console.log('\n3️⃣ Testing database connection (fetching changemakers)...')
  try {
    const { data, error } = await supabase
      .from('changemakers')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('   Error details:', error)
      if (error.code === 'PGRST116') {
        console.log('   💡 Tip: Make sure you\'ve run the supabase_schema.sql file')
      }
      if (error.code === '42501' || error.message.includes('permission')) {
        console.log('   💡 Tip: Check your Row Level Security (RLS) policies')
      }
      return false
    }
    console.log('✅ Database connection successful')
    console.log(`   Found ${data?.length || 0} changemaker(s)`)

    // Test 4: Test initiatives table
    console.log('\n4️⃣ Testing initiatives table...')
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('id, title, status')
      .limit(5)

    if (initiativesError) {
      console.error('❌ Failed to fetch initiatives:', initiativesError.message)
      return false
    }
    console.log('✅ Initiatives table accessible')
    console.log(`   Found ${initiatives?.length || 0} initiative(s)`)
    if (initiatives && initiatives.length > 0) {
      console.log('   Sample initiatives:')
      initiatives.forEach((init: { title: string; status: string }, idx: number) => {
        console.log(`     ${idx + 1}. ${init.title} (${init.status})`)
      })
    }

    // Test 5: Test milestones table
    console.log('\n5️⃣ Testing milestones table...')
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, title, initiative_id')
      .limit(5)

    if (milestonesError) {
      console.error('❌ Failed to fetch milestones:', milestonesError.message)
      return false
    }
    console.log('✅ Milestones table accessible')
    console.log(`   Found ${milestones?.length || 0} milestone(s)`)

    console.log('\n🎉 All tests passed! Supabase is connected correctly.')
    return true
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    console.error('   Full error:', error)
    return false
  }
}

/**
 * Quick test - just check if we can connect
 */
export const quickTest = async () => {
  try {
    const { error } = await supabase.from('changemakers').select('id').limit(1)
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    console.log('✅ Supabase connection working!')
    return true
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return false
  }
}

