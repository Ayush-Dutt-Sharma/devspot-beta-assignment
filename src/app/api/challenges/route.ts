import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const challengeData = await request.json();

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: hackathon } = await supabase
      .from('hackathons')
      .select('creator_id, total_budget')
      .eq('id', challengeData.hackathon_id)
      .single();

    if (!hackathon || hackathon.creator_id !== userData.id) {
      return NextResponse.json({ error: 'Hackathon not found or unauthorized' }, { status: 404 });
    }

    if (!challengeData.judging_criteria || challengeData.judging_criteria.length < 4) {
      return NextResponse.json({ 
        error: 'Minimum 4 judging criteria required for each challenge' 
      }, { status: 400 });
    }

    const { data: existingChallenges } = await supabase
      .from('challenges')
      .select('prize_amount')
      .eq('hackathon_id', challengeData.hackathon_id);

    const currentTotalPrizes = existingChallenges?.reduce((sum, challenge) => sum + (challenge.prize_amount || 0), 0) || 0;
    const newTotal = currentTotalPrizes + (challengeData.prize_amount || 0);

    if (newTotal > hackathon.total_budget) {
      return NextResponse.json({ 
        error: `Challenge prizes ($${newTotal}) cannot exceed hackathon budget ($${hackathon.total_budget})` 
      }, { status: 400 });
    }

    const { data: newChallenge, error } = await supabase
      .from('challenges')
      .insert(challengeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    return NextResponse.json({ challenge: newChallenge });

  } catch (error) {
    console.error('Challenge create API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
