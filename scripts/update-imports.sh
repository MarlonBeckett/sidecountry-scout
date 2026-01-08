#!/bin/bash

# Script to update imports after code restructuring
# This updates all import paths to use the new structure

echo "Updating imports across the codebase..."

# Update component imports
find app components hooks -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/components/LocationSelector'|from '@/components/location/LocationSelector'|g" \
  -e "s|from '@/components/LocationSelectorSheet'|from '@/components/location/LocationSelectorSheet'|g" \
  -e "s|from '@/components/BottomNav'|from '@/components/navigation/BottomNav'|g" \
  -e "s|from '@/components/DesktopSidebar'|from '@/components/navigation/DesktopSidebar'|g" \
  -e "s|from '@/components/LayoutWrapper'|from '@/components/navigation/LayoutWrapper'|g" \
  -e "s|from '@/components/WeatherCard'|from '@/components/weather/WeatherCard'|g" \
  -e "s|from '@/components/ChatHistorySidebar'|from '@/components/chat/ChatHistorySidebar'|g" \
  -e "s|from '@/components/ForecastPhotoGallery'|from '@/components/forecast/ForecastPhotoGallery'|g" \
  {} \;

# Update lib imports
find app components hooks lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/htmlUtils'|from '@/lib/utils'|g" \
  -e "s|from '@/lib/avalancheCenterMapping'|from '@/lib/utils'|g" \
  -e "s|from '@/lib/supabase'|from '@/lib/db'|g" \
  {} \;

echo "Import updates complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to check for any type errors"
echo "2. Review and fix any remaining import issues"
echo "3. Test the application thoroughly"
