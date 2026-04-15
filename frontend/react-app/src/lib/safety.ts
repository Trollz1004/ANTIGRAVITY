import { api, ApiError } from './api';

export async function isSafetyToolsAvailable(): Promise<boolean> {
  try {
    await api.get('/safety/blocks');
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return false;
    }
    return false;
  }
}
