import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nycbrohrtvteopadoyct.supabase.co',
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { center, zone } = body;

    if (!center || !zone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: center and zone' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Delete the existing briefing
    const { error: deleteError } = await supabase
      .from('avalanche_briefings')
      .delete()
      .eq('center', center)
      .eq('zone', zone)
      .eq('forecast_date', today);

    if (deleteError) {
      console.error('Error deleting old briefing:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete old briefing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Old briefing deleted. Refresh to generate a new one.'
    });

  } catch (error) {
    console.error('Error in regenerate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate briefing'
      },
      { status: 500 }
    );
  }
}
