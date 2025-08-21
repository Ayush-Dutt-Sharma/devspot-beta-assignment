import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: hackathon, error } = await supabase
      .from('hackathons')
      .select(`
        *,
        challenges (*),
        hackathon_sponsors (
          *,
          sponsors (*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ hackathon })
  } catch (error) {
    console.error('Error fetching hackathon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const { data: hackathon, error } = await supabase
      .from('hackathons')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ hackathon })
  } catch (error) {
    console.error('Error updating hackathon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
