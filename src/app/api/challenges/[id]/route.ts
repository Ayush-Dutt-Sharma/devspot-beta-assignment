import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@clerk/nextjs/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const challengeId = params.id;
    const updates = await request.json();

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingChallenge } = await supabase
      .from('challenges')
      .select('hackathon_id, prize_amount')
      .eq('id', challengeId)
      .single();

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { data: hackathon } = await supabase
      .from('hackathons')
      .select('creator_id, total_budget')
      .eq('id', existingChallenge.hackathon_id)
      .single();

    if (!hackathon || hackathon.creator_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (updates.judging_criteria && updates.judging_criteria.length < 4) {
      return NextResponse.json({ 
        error: 'Minimum 4 judging criteria required for each challenge' 
      }, { status: 400 });
    }

    if (updates.prize_amount !== undefined) {
      const { data: otherChallenges } = await supabase
        .from('challenges')
        .select('prize_amount')
        .eq('hackathon_id', existingChallenge.hackathon_id)
        .neq('id', challengeId);

      const otherPrizesTotal = otherChallenges?.reduce((sum, challenge) => sum + (challenge.prize_amount || 0), 0) || 0;
      const newTotal = otherPrizesTotal + (updates.prize_amount || 0);

      if (newTotal > hackathon.total_budget) {
        return NextResponse.json({ 
          error: `Challenge prizes ($${newTotal}) cannot exceed hackathon budget ($${hackathon.total_budget})` 
        }, { status: 400 });
      }
    }

    const { data: updatedChallenge, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', challengeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating challenge:', error);
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
    }

    return NextResponse.json({ challenge: updatedChallenge });

  } catch (error) {
    console.error('Challenge update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const challengeId = params.id;

    // Get current user's database ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingChallenge } = await supabase
      .from('challenges')
      .select('hackathon_id')
      .eq('id', challengeId)
      .single();

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { data: hackathon } = await supabase
      .from('hackathons')
      .select('creator_id')
      .eq('id', existingChallenge.hackathon_id)
      .single();

    if (!hackathon || hackathon.creator_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: allChallenges } = await supabase
      .from('challenges')
      .select('id')
      .eq('hackathon_id', existingChallenge.hackathon_id);

    if (allChallenges && allChallenges.length <= 2) {
      return NextResponse.json({ 
        error: 'Cannot delete challenge. Minimum 2 challenges required.' 
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) {
      console.error('Error deleting challenge:', error);
      return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Challenge deleted successfully' });

  } catch (error) {
    console.error('Challenge delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}