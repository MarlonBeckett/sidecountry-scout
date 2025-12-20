import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch user preferences
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data || null
    });
  } catch (error) {
    console.error('Error in GET /api/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update user preferences
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, selectedCenter, selectedZone } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to update first
    const { data: existingData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingData) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({
          selected_center: selectedCenter,
          selected_zone: selectedZone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          selected_center: selectedCenter,
          selected_zone: selectedZone
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving preferences:', result.error);
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: result.data
    });
  } catch (error) {
    console.error('Error in POST /api/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
