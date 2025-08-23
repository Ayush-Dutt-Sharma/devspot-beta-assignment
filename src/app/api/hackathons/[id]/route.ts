import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
     const params = await context.params;
    const { data: hackathon, error } = await supabase
      .from('hackathons')
      .select(`
        *,
        challenges (*)
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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const params = await context.params;
    const hackathonId = params.id;
    const updates = await request.json();

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingHackathon } = await supabase
      .from('hackathons')
      .select('creator_id, total_budget')
      .eq('id', hackathonId)
      .single();

    if (!existingHackathon || existingHackathon.creator_id !== userData.id) {
      return NextResponse.json({ error: 'Hackathon not found or unauthorized' }, { status: 404 });
    }

    if (updates.total_budget !== undefined) {
      if (updates.total_budget < 20000) {
        return NextResponse.json({ 
          error: 'Total budget must be at least $20,000 USDC' 
        }, { status: 400 });
      }

      const { data: challenges } = await supabase
        .from('challenges')
        .select('prize_amount')
        .eq('hackathon_id', hackathonId);

      const totalPrizes = challenges?.reduce((sum, challenge) => sum + (challenge.prize_amount || 0), 0) || 0;
      
      if (updates.total_budget < totalPrizes) {
        return NextResponse.json({ 
          error: `Total budget ($${updates.total_budget}) cannot be lower than sum of challenge prizes ($${totalPrizes})` 
        }, { status: 400 });
      }
    }

    const { data: updatedHackathon, error } = await supabase
      .from('hackathons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', hackathonId)
      .select()
      .single();

    if (error) {
      console.error('Error updating hackathon:', error);
      return NextResponse.json({ error: 'Failed to update hackathon' }, { status: 500 });
    }

    return NextResponse.json({ hackathon: updatedHackathon });

  } catch (error) {
    console.error('Hackathon update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
