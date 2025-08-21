import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createAdminClient()

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}