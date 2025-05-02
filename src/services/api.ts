import { tokenService } from './TokenService';
import { userService } from './UserService';

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = tokenService.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchProtectedData = async () => {
  const res = await fetch('http://localhost:8080/api/protected', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('API call failed');
  return res.text();
};

export const getUserInfo = async () => {
  const res = await fetch('http://localhost:8080/api/users/me', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Failed to fetch user');
  const userData = await res.json();
  
  // Store the user ID for later use
  if (userData && userData.id) {
    userService.setUserId(userData.id);
  }
  
  return userData;
};

export const fetchNotifications = async (userId: string, limit: number, offset: number) => {
  const url = new URL(`http://localhost:8080/api/users/${userId}/notifications/sent`);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Failed to fetch notifications');
  return await res.json();
};

// Backward compatibility function for legacy code
export const withToken = (token: string) => {
  return {
    fetchProtectedData: async () => fetchProtectedData(),
    getUserInfo: async () => getUserInfo(),
    fetchNotifications: async (userId: string, limit: number, offset: number) => 
      fetchNotifications(userId, limit, offset)
  };
};

