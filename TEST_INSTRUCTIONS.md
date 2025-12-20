# User Preference Testing Instructions

## What Was Implemented

The app now saves your selected avalanche center and zone in the browser's localStorage, so your selection persists across sessions.

## Key Features

1. **Persistent Selection**: Your selected center and zone are automatically saved and restored when you return to the site
2. **No Auto-Selection for New Users**: New users see an empty state with a welcome message instead of auto-loading a random center
3. **No Wasted AI Tokens**: Briefings are only generated when you actually select a zone
4. **Seamless Updates**: Changing your selection automatically saves the new preference

## Testing Steps

### Test 1: New User Experience
1. Open Chrome DevTools (F12)
2. Go to Application tab > Storage > Local Storage
3. Clear all local storage for localhost:3000
4. Refresh the page
5. **Expected**: You should see:
   - "Select Location" in the location selector
   - Welcome message: "Welcome to SideCountry Scout!"
   - No briefing is generated (no AI tokens used)
   - No auto-selected center

### Test 2: Selecting a Location
1. Click on "Select Location"
2. Choose an avalanche center (e.g., "Northwest Avalanche Center")
3. Choose a zone (e.g., "Olympics")
4. **Expected**:
   - Location selector shows your selection
   - Briefing loads or generates
   - localStorage shows `selectedCenter` and `selectedZone`

### Test 3: Persistence Across Sessions
1. After selecting a location (Test 2)
2. Refresh the page (F5)
3. **Expected**:
   - Your previously selected center and zone are automatically loaded
   - The briefing for that location loads immediately
   - No need to re-select

### Test 4: Changing Selection
1. Click on the location selector again
2. Choose a different center or zone
3. **Expected**:
   - New selection is saved to localStorage
   - New briefing loads
   - Refresh the page and the new selection persists

### Test 5: Chat Integration
1. Select a center and zone on the briefings tab
2. Navigate to the chat tab
3. Ask a location-specific question (e.g., "Is it safe to ride today?")
4. **Expected**:
   - Chat shows "Tracking: [Your Zone]"
   - AI responses include context from your selected location
   - Current danger levels and conditions are referenced

## Verifying in DevTools

**localStorage Keys:**
- `selectedCenter`: The name of your selected avalanche center (e.g., "Northwest Avalanche Center")
- `selectedZone`: The name of your selected zone (e.g., "Olympics")

**To View:**
1. F12 > Application tab > Local Storage > http://localhost:3000
2. You should see these keys with your selections

## Expected Behavior Summary

| Scenario | Behavior |
|----------|----------|
| First-time user | Empty selector, welcome message, no AI generation |
| After selecting | Briefing loads/generates, preferences saved |
| Returning user | Previous selection auto-loads, briefing displays |
| Changing selection | New choice saved immediately, new briefing loads |
| Using chat | Chat has context of selected location |

## Notes

- Preferences are stored in localStorage (browser-specific)
- Clearing browser data will reset your selection
- Each browser/device maintains its own preferences
- No server-side storage needed (fast and simple)
