# Frontend API URL Fix

## Issue

Your frontend is trying to call API endpoints on itself instead of on your backend server:

```
GET https://skillify-phi.vercel.app/api/gamification/profile 404 (Not Found)
```

This is happening because somewhere in your code, the API URL is not being set correctly for all requests.

## Solution

### 1. Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Make sure `VITE_API_URL` is set to `https://skillify-2irh.onrender.com`
4. If it's not set or is set incorrectly, update it and redeploy your frontend

### 2. Check Your Frontend Code

The issue might be in your `AppContext.tsx` file. Look for the `fetchGamificationData` function and make sure it's using the `apiClient` for all API calls:

```typescript
const fetchGamificationData = async () => {
  try {
    setLoading(prev => ({ ...prev, gamification: true }));
    
    // CORRECT: Use apiClient which has the proper base URL
    const response = await apiClient.get('/gamification/profile');
    
    if (response.data.success) {
      setGamification(response.data.gamificationData);
    }
  } catch (error) {
    // Don't show error toast to user to avoid annoyance, just log to console
  } finally {
    setLoading(prev => ({ ...prev, gamification: false }));
  }
};
```

### 3. Check for Hardcoded URLs

Search your codebase for any hardcoded URLs or incorrect API paths:

```
grep -r "skillify-phi.vercel.app" src/
grep -r "/api/gamification" src/
```

### 4. Debug the API Client

Add some debug logging to your `axios.ts` file to see what base URL is being used:

```typescript
// In src/lib/axios.ts
const baseURL = getApiBaseUrl();
console.log('API Client base URL:', baseURL);

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
});
```

### 5. Test the Fix

After making these changes:
1. Redeploy your frontend to Vercel
2. Check the browser console to make sure all API requests are going to your Render backend
3. Verify that the gamification data is being loaded correctly 