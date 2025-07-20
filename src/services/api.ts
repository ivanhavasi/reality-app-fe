import { tokenService } from './TokenService';
import { userService } from './UserService';
import { 
  Notification,
  AddNotificationCommand
} from '../types/notifications';

// API base URL from environment variable with fallback to localhost
// export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const API_BASE_URL = 'https://reality.havasi.me';

// Callback function to handle logout when token expires
let onTokenExpired: (() => void) | null = null;

// Function to set the token expiration callback
export const setTokenExpirationCallback = (callback: () => void) => {
  onTokenExpired = callback;
};

// Helper function to get authorization headers
export const getAuthHeaders = () => {
  const token = tokenService.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Enhanced API fetch wrapper that handles token expiration
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options);

  // Check if the response is 401 (Unauthorized) - token expired or invalid
  if (response.status === 401) {
    console.warn('Token expired or invalid, clearing token and triggering logout');

    // Clear the expired token
    tokenService.removeToken();
    userService.removeUserId();

    // Trigger logout callback if available
    if (onTokenExpired) {
      onTokenExpired();
    }

    // Throw a specific error for token expiration
    throw new Error('Authentication token has expired. Please log in again.');
  }

  return response;
};

// Helper function to handle API errors
export const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  let errorMessage = defaultMessage;
  
  try {
    // Try to get the error message from the response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } else {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }
  } catch (e) {
    console.error('Error parsing error response:', e);
  }
  
  // Add status code to the error message
  if (response.status >= 400 && response.status < 500) {
    errorMessage = `Client Error (${response.status}): ${errorMessage}`;
  } else if (response.status >= 500) {
    errorMessage = `Server Error (${response.status}): ${errorMessage}`;
  }
  
  throw new Error(errorMessage);
};

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: Date;
}

export const getUserInfo = async (): Promise<User> => {
  const res = await apiRequest(`${API_BASE_URL}/api/users/me`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) await handleApiError(res, 'Failed to fetch user');
  const userData = await res.json();
  
  // Store the user ID for later use
  if (userData && userData.id) {
    userService.setUserId(userData.id);
  }
  
  return userData;
};

export const fetchNotifications = async (userId: string, limit: number, offset: number) => {
  const url = new URL(`${API_BASE_URL}/api/users/${userId}/notifications/sent`);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());

  const res = await apiRequest(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!res.ok) await handleApiError(res, 'Failed to fetch notifications');
  return await res.json();
};

// Get user notifications
export const getUserNotifications = async (): Promise<Notification[]> => {
  const userId = userService.getUserId();
  console.log('Getting notifications for user ID:', userId);
  
  if (!userId) throw new Error('User ID not found');

  const url = `${API_BASE_URL}/api/users/${userId}/notifications`;
  console.log('Fetching from URL:', url);
  
  const res = await apiRequest(url, {
    headers: getAuthHeaders(),
  });

  console.log('API response status:', res.status);

  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch notifications');
  }

  const data = await res.json();
  console.log('Notifications data received:', data);
  return data;
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const userId = userService.getUserId();
  if (!userId) throw new Error('User ID not found');

  const res = await apiRequest(`${API_BASE_URL}/api/users/${userId}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) await handleApiError(res, 'Failed to delete notification');
};

// Enable a notification
export const enableNotification = async (notificationId: string): Promise<Notification> => {
  const userId = userService.getUserId();
  if (!userId) throw new Error('User ID not found');

  const res = await apiRequest(`${API_BASE_URL}/api/users/${userId}/notifications/${notificationId}/enable`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) await handleApiError(res, 'Failed to enable notification');
  return await res.json();
};

// Disable a notification
export const disableNotification = async (notificationId: string): Promise<Notification> => {
  const userId = userService.getUserId();
  if (!userId) throw new Error('User ID not found');

  const res = await apiRequest(`${API_BASE_URL}/api/users/${userId}/notifications/${notificationId}/disable`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) await handleApiError(res, 'Failed to disable notification');
  return await res.json();
};

// Add a new notification
export const addNotification = async (command: AddNotificationCommand): Promise<Notification> => {
  const userId = userService.getUserId();
  if (!userId) throw new Error('User ID not found');

  const res = await apiRequest(`${API_BASE_URL}/api/users/${userId}/notifications`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) await handleApiError(res, 'Failed to add notification');
  return await res.json();
};

// Function to validate if the current token is still valid
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = tokenService.getToken();
    if (!token) return false;

    // Try to fetch user info to validate the token
    await getUserInfo();
    return true;
  } catch (error) {
    console.warn('Token validation failed:', error);
    return false;
  }
};

// Backward compatibility function for legacy code
export const withToken = (token: string) => {
  return {
//     fetchProtectedData: async () => fetchProtectedData(),
    getUserInfo: async () => getUserInfo(),
    fetchNotifications: async (userId: string, limit: number, offset: number) => 
      fetchNotifications(userId, limit, offset)
  };
};
