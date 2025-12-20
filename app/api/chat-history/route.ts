import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_SECRET_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all chats for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: chats, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('Error in GET /api/chat-history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, center, zone, title, messages } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    const { data: chat, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        center: center || null,
        zone: zone || null,
        title: title || 'New Chat',
        messages: messages
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, chatId: chat.id });
  } catch (error) {
    console.error('Error in POST /api/chat-history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing chat
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, center, zone, title, messages } = body;

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('chat_history')
      .update({
        center: center || null,
        zone: zone || null,
        title: title || 'New Chat',
        messages: messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/chat-history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat-history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
