import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";


export async function POST(request: NextRequest) {
  try {
     const { userId } = await auth();
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    const body = await request.json();
    const { hackathonId, action } = body;

    if ( !hackathonId || action !== 'complete_payment') {
      return NextResponse.json(
        { error: 'Missing required fields or invalid action' },
        { status: 400 }
      );
    }
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('hackathons')
      .update({ 
        isPaid: true,
        status: 'published'
      })
      .eq('id', hackathonId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update hackathon payment status' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment completed successfully',
      hackathon: data[0]
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathonId');

    if (!hackathonId) {
      return NextResponse.json(
        { error: 'Missing hackathonId parameter' },
        { status: 400 }
      );
    }
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('hackathons')
      .select('isPaid, status')
      .eq('id', hackathonId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hackathon payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus: {
        isPaid: data.isPaid,
        status: data.status
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}