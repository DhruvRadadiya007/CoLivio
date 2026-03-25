import { projectId } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5bec5893`;

export async function checkServerHealth(): Promise<boolean> {
  try {
    console.log('Checking server health at:', `${API_BASE_URL}/health`);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Server health check:', data);
      return data.status === 'ok';
    }
    
    console.error('Server health check failed:', response.status, response.statusText);
    return false;
  } catch (error) {
    console.error('Server health check error:', error);
    return false;
  }
}

export function getServerURL(): string {
  return API_BASE_URL;
}
