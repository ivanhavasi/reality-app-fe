import { API_BASE_URL, getAuthHeaders, handleApiError, apiRequest } from "./api";
import { MarketStatistics, StatisticsQueryParams } from "../types/statistics";

class StatisticsService {
  async getMarketStatistics(params: StatisticsQueryParams): Promise<MarketStatistics[]> {
    const url = new URL(`${API_BASE_URL}/api/statistics/market`);

    // Add query parameters
    if (params.city) url.searchParams.append('city', params.city);
    if (params.district) url.searchParams.append('district', params.district);
    if (params.buildingType) url.searchParams.append('buildingType', params.buildingType);
    if (params.transactionType) url.searchParams.append('transactionType', params.transactionType);
    if (params.subCategory) url.searchParams.append('subCategory', params.subCategory);
    if (params.sizeMin !== undefined) url.searchParams.append('sizeMin', params.sizeMin.toString());
    if (params.sizeMax !== undefined) url.searchParams.append('sizeMax', params.sizeMax.toString());
    if (params.period) url.searchParams.append('period', params.period);
    if (params.granularity) url.searchParams.append('granularity', params.granularity);
    if (params.groupBy && params.groupBy.length > 0) {
      params.groupBy.forEach(dimension => url.searchParams.append('groupBy', dimension));
    }

    const res = await apiRequest(url.toString(), {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to fetch market statistics');
    }

    return res.json();
  }
}

export default new StatisticsService();