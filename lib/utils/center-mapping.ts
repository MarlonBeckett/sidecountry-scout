/**
 * Mapping of avalanche center names to their API center_id codes
 * This is critical for Product API calls which require center_id parameter
 */
export const CENTER_ID_MAP: Record<string, string> = {
  // Major US Centers
  'Sierra Avalanche Center': 'SAC',
  'Northwest Avalanche Center': 'NWAC',
  'Colorado Avalanche Information Center': 'CAIC',
  'Utah Avalanche Center': 'UAC',
  'Bridger-Teton Avalanche Center': 'BTAC',
  'Gallatin National Forest Avalanche Center': 'GNFAC',
  'Central Oregon Avalanche Center': 'COAA',
  'Mount Washington Avalanche Center': 'MWAC',
  'Sawtooth Avalanche Center': 'SAW',
  'Wallowa Avalanche Center': 'WAC',
  'Flathead Avalanche Center': 'FAC',
  'Chugach National Forest Avalanche Information Center': 'CNFAIC',
  'Hatcher Pass Avalanche Center': 'HPAC',
  'West Central Montana Avalanche Center': 'WCMAC',
  'Payette Avalanche Center': 'PAC',
  'Crested Butte Avalanche Center': 'CBAC',
  'Friends of CBAC': 'FCBAC',
  'Tahoe National Forest': 'ESAC',
  'Eastern Sierra Avalanche Center': 'ESAC',
  'Snoqualmie Pass': 'NWAC',
  'Mount Shasta Avalanche Center': 'MSAC',
  // Add more as discovered through testing and error logs
};

/**
 * Get the center_id for a given center name
 * Returns null if no mapping exists
 */
export function getCenterId(centerName: string): string | null {
  return CENTER_ID_MAP[centerName] || null;
}

/**
 * Check if a center has a mapping
 */
export function hasCenterMapping(centerName: string): boolean {
  return centerName in CENTER_ID_MAP;
}
