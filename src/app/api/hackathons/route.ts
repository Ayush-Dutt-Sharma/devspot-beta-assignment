import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: hackathons, error } = await supabase
      .from('hackathons')
      .select(`
        *,
        challenges (*)
      `)
      .eq('creator_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ hackathons })
  } catch (error) {
    console.error('Error fetching hackathons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase =await createAdminClient()

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
        ...body.hackathon,
        creator_id: userData.id
      })
      .select()
      .single()

    if (hackathonError) throw hackathonError

    if (body.challenges && body.challenges.length > 0) {
      const challengesData = body.challenges.map((challenge: any, index: number) => ({
        ...challenge,
        hackathon_id: hackathon.id,
        order_index: index
      }))

      const { error: challengesError } = await supabase
        .from('challenges')
        .insert(challengesData)

      if (challengesError) throw challengesError
    }

    return NextResponse.json({ hackathon })
  } catch (error) {
    console.error('Error creating hackathon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}