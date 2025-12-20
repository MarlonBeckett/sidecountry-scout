import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nycbrohrtvteopadoyct.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Y2Jyb2hydHZ0ZW9wYWRveWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjAwMzIsImV4cCI6MjA4MTY5NjAzMn0.1QTzdnDA06_FV7Wzu6wpgvtgl76WQYKjtCyIaBgvhMA'
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const center = searchParams.get('center');
    const zone = searchParams.get('zone');

    if (!center || !zone) {
      return NextResponse.json(
        { success: false, error: 'Center and zone are required' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Fetch briefing from Supabase
    const { data: briefing, error } = await supabase
      .from('avalanche_briefings')
      .select('*')
      .eq('center', center)
      .eq('zone', zone)
      .eq('forecast_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching briefing:', error);
      throw new Error('Failed to fetch briefing');
    }

    if (!briefing) {
      return NextResponse.json({
        success: true,
        briefing: null,
        message: 'No briefing found for this location and date'
      });
    }

    return NextResponse.json({
      success: true,
      briefing
    });

  } catch (error) {
    console.error('Error fetching briefing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch briefing'
      },
      { status: 500 }
    );
  }
}
