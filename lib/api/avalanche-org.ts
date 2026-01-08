/**
 * Avalanche.org API Client
 * Handles all interactions with avalanche.org APIs
 */

import { AVALANCHE_ORG_API } from '@/constants';
import type {
  MapLayerApiResponse,
  ProductApiResponse,
} from '@/types';

export class AvalancheOrgClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AVALANCHE_ORG_API.BASE_URL;
  }

  /**
   * Fetch all zones from the Map-Layer API
   */
  async fetchMapLayer(): Promise<MapLayerApiResponse> {
    const url = `${this.baseUrl}${AVALANCHE_ORG_API.ENDPOINTS.MAP_LAYER}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Map-Layer API failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch detailed forecast for a specific center and zone
   */
  async fetchProduct(centerId: string, zoneId: string): Promise<ProductApiResponse | null> {
    const url = `${this.baseUrl}${AVALANCHE_ORG_API.ENDPOINTS.PRODUCT}?type=forecast&center_id=${centerId}&zone_id=${zoneId}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Product API failed for ${centerId}/${zoneId}: ${response.status}`);
      return null;
    }

    return response.json();
  }

  /**
   * Fetch products for multiple zones in parallel
   */
  async fetchProductsBatch(requests: Array<{ centerId: string; zoneId: string }>): Promise<Map<string, ProductApiResponse>> {
    const results = new Map<string, ProductApiResponse>();

    const promises = requests.map(async ({ centerId, zoneId }) => {
      const key = `${centerId}:${zoneId}`;
      const data = await this.fetchProduct(centerId, zoneId);
      if (data) {
        results.set(key, data);
      }
    });

    await Promise.all(promises);
    return results;
  }
}

// Export singleton instance
export const avalancheOrgClient = new AvalancheOrgClient();
