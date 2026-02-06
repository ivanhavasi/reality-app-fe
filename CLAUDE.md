# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript application for a real estate platform ("Havasi Reality Platform"). It's a Create React App with Google OAuth authentication, real estate listings management, and notification features. The app has both public and authenticated views.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Run tests in watch mode
npm test

# Build for production
npm run build
```

## Architecture

### Context-Based State Management

The app uses React Context API for global state management with four main contexts:

- **AuthContext** (`src/context/AuthContext.tsx`): Manages authentication state, token storage, and login/logout flows. Automatically validates tokens on app initialization and handles token expiration through API interceptors.
- **UserContext** (`src/context/UserContext.tsx`): Stores current user information after login.
- **RealEstateContext** (`src/context/RealEstateContext.tsx`): Caches real estate listings to avoid redundant API calls.
- **ErrorContext** (`src/context/ErrorContext.tsx`): Global error handling with toast notifications.

Context providers are nested in `App.tsx` in this order: GoogleOAuthProvider → UserProvider → AuthProvider → RealEstateProvider → Router.

### Authentication Flow

1. Google OAuth is used for authentication via `@react-oauth/google`.
2. On successful login, the access token is stored in localStorage via `TokenService`.
3. The `AuthContext` automatically validates the token on app initialization by fetching user info.
4. API requests include the token via `getAuthHeaders()` in `src/services/api.ts`.
5. A global API interceptor (`apiRequest`) detects 401 responses, clears the token, and triggers logout through a callback mechanism.
6. The app distinguishes between authenticated and unauthenticated views (e.g., `RealEstateDetail` vs `PublicRealEstateDetail`).

### API Service Layer

All API calls go through `src/services/api.ts` which provides:

- `API_BASE_URL`: Hardcoded to `https://reality.havasi.me` (overrides environment variable)
- `apiRequest()`: Wrapper around fetch that handles 401 token expiration automatically
- `getAuthHeaders()`: Returns Authorization header with Bearer token
- `handleApiError()`: Extracts error messages from responses with proper formatting

Service modules (`RealEstateService.ts`, `UserService.ts`, `TokenService.ts`) use these utilities for specific domains.

### Routing Structure

The app uses `react-router-dom` v7 with conditional rendering based on authentication:

- `/login`: Login page (redirects to `/dashboard` if authenticated)
- `/real-estates/:id`: Shows `PublicRealEstateDetail` for unauthenticated users, `RealEstateDetail` in `AdminLayout` for authenticated users
- All other routes require authentication and render within `AdminLayout`:
  - `/dashboard`: Dashboard page
  - `/real-estates`: Real estate listings with advanced search
  - `/notifications`: User's notification settings
  - `/sent-notifications`: Notifications received by the user
  - `/settings`: User settings

### Layout Components

- **AdminLayout** (`src/components/AdminLayout.tsx`): Main authenticated layout with fixed navbar, collapsible sidebar, and responsive design. On mobile (<768px), sidebar is an overlay; on desktop, it's fixed and pushes content.
- **Sidebar** (`src/components/Sidebar.tsx`): Navigation sidebar with theme toggle and logout functionality.
- **AdminRoute** (`src/components/AdminRoute.tsx`): Route wrapper that checks authentication.

### Key UI Patterns

- **Responsive Design**: Mobile-first with breakpoint at 768px. Sidebar behavior changes (overlay vs fixed), and spacing adjusts for small screens.
- **Bootstrap 5**: Used for layout and components via `react-bootstrap`. Theme support via `data-bs-theme` attribute.
- **OpenStreetMap Integration**: Real estate locations are displayed using Leaflet (`react-leaflet`) with OpenStreetMap tiles. See `OpenStreetMap.tsx` and `MultiRealEstateMap.tsx`.
- **Dual Range Sliders**: Custom component (`DualRangeSlider.tsx`) for filtering price and size ranges.

### TypeScript Types

Core types are defined in `src/types/`:

- `realEstate.ts`: `RealEstate`, `Locality`, `Duplicate` interfaces
- `user.ts`: User-related types
- `notifications.ts`: Notification types including `AddNotificationCommand`

### Token Storage

Tokens are persisted in localStorage via `TokenService`. The key is `'authToken'`. User ID is stored separately with key `'userId'`. Both are cleared on logout or token expiration.

### Error Handling

Errors are displayed via a Toast component (`ErrorToast.tsx`) that subscribes to `ErrorContext`. Set errors with `setError()` from the context, and they automatically display and clear after 5 seconds.

## Important Implementation Notes

- **Token Expiration**: Never manually check token expiration. The `apiRequest` wrapper automatically detects 401 responses and triggers logout. Just use `apiRequest()` for authenticated calls.
- **User ID**: After login, `getUserInfo()` is called which stores the user ID in localStorage via `userService.setUserId()`. This ID is used for constructing API URLs (e.g., `/api/users/{userId}/notifications`).
- **Context Hook Usage**: Always use context hooks (`useAuth`, `useUser`, `useRealEstate`, `useError`) within provider boundaries. They throw errors if used outside providers.
- **Map Components**: When working with Leaflet maps, ensure `leaflet/dist/leaflet.css` is imported. Marker icons require special handling in React-Leaflet.
- **Environment Variables**: The API base URL is currently hardcoded to production (`https://reality.havasi.me`). To use environment variables, uncomment the line in `src/services/api.ts` and set `REACT_APP_API_BASE_URL`.

## Styling

- Bootstrap 5 CSS is globally imported in `index.tsx`
- Custom styles in `modern-styles.css` and `mobile-improvements.css`
- Theme switching (light/dark) is persisted to localStorage with key `'theme'`
- The app uses CSS-in-JS for component-specific styles (inline `style` props)