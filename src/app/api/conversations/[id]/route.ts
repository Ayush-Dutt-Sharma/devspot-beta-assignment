import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { get } from 'http'

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase =await createClient()

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (params.id === 'new') {
      const { data: hackathon, error: hackathonError } = await supabase
        .from('hackathons')
        .insert({
          title: 'Untitled Hackathon',
          status: 'draft',
          creator_id: userData.id
        })
        .select()
        .single()

      if (hackathonError) throw hackathonError

      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: userData.id,
          hackathon_id: hackathon.id,
          current_step: body.current_step,
          conversation_data: body.conversation_data,
          method: body.method || 'ai'
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      return NextResponse.json({ conversation, hackathon })
    } else {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .update({
          current_step: body.current_step,
          conversation_data: body.conversation_data,
          method: body.method || 'ai'
        })
        .eq('id', params.id)
        .eq('user_id', userData.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ conversation })
    }
  } catch (error) {
    console.error('Error managing conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userData.id)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ conversation: conversation || null })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
