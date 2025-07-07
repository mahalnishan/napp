import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askGemini } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      const publicPrompt = `You are Effortless site assistant. Answer public questions about the platform (features, pricing, getting started). Do NOT reveal any user data or orders. If asked for personal or order-specific info, say you can only share that after sign-in.`
      const answer = await askGemini(`${publicPrompt}\n\nVisitor: ${message}`)
      return NextResponse.json({ answer })
    }

    // Fetch the user's recent orders
    const { data: orders, error: orderError } = await supabase
      .from('work_orders')
      .select('id, status, schedule_date_time, order_amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (orderError) {
      console.error('Supabase order fetch error', orderError)
    }

    // Fetch active clients info (limited fields)
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name')

    if (clientError) {
      console.error('Supabase client fetch error', clientError)
    }

    const ordersJson = JSON.stringify(orders || [])
    const clientsJson = JSON.stringify(clients || [])

    const systemPrompt = `You are Effortless order assistant. Answer the user's questions in plain English sentences (no code snippets or jQuery). Use ONLY the provided JSON arrays of their orders and clients. Include relevant client info (name, email, phone) when it helps answer the question. If the user asks something unrelated, politely say you can only help with order or client questions.`

    const answer = await askGemini(`${systemPrompt}\n\nOrders:\n${ordersJson}\n\nClients:\n${clientsJson}\n\nUser: ${message}`)

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Chat API error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 