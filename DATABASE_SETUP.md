# Database Setup Instructions

## Run This SQL in Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nycbrohrtvteopadoyct
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL below
5. Click "Run" to execute

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_center TEXT,
  selected_zone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- Create policies for authenticated users
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON user_preferences(user_id);
```

## Enable Email Auth in Supabase

1. Go to Authentication > Providers in your Supabase dashboard
2. Make sure "Email" is enabled
3. Configure email settings if needed (for production, set up a custom SMTP)

## Test the Setup

After running the SQL:

1. Go to http://localhost:3000/auth
2. Sign up with an email and password
3. Check your email for confirmation (in development, check Supabase logs for the link)
4. After confirming, sign in
5. Select an avalanche center and zone
6. Your selection should be saved to the database
7. Refresh the page - your selection should persist
8. Check the database: Go to "Table Editor" > "user_preferences" to see your saved data

## Troubleshooting

### Can't create table
- Make sure you're running the SQL as a superuser/service role
- Check if the table already exists
- Look for error messages in the SQL editor

### RLS Errors
- Make sure policies are created correctly
- Check that auth.uid() works in your policies
- Verify users are properly authenticated

### Preferences not saving
- Check browser console for errors
- Verify the API route is working: `/api/preferences`
- Check Supabase logs for database errors
- Make sure RLS policies allow INSERT and UPDATE

## What This System Does

- **Authentication**: Users must sign up/login to use the app
- **User Preferences**: Each user's selected center and zone are stored in the database
- **Persistence**: Preferences load automatically when user signs in
- **Security**: RLS ensures users can only see/edit their own preferences
- **Auto-save**: Preferences save automatically when changed
