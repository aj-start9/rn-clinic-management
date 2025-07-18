# Supabase React Native / Expo Compatibility Fix

## The Problem

When using Supabase with Expo and React Native, you might encounter errors like:
- "Protocol is not implemented" in Hermes JS engine
- "TextEncoder is not defined"
- "URL is not defined"
- Various crypto-related errors

## The Solution

### 1. Install Required Polyfills

```bash
npm install react-native-url-polyfill expo-crypto text-encoding
```

### 2. Update Your Files

The following files have been updated to fix compatibility issues:

#### `src/polyfills.ts` (New file)
Contains all necessary polyfills for React Native compatibility.

#### `App.tsx`
Now imports polyfills at the top to ensure they load before anything else.

#### `src/services/supabase.ts`
Updated with React Native-specific configuration options.

#### `metro.config.js` (New file)
Metro bundler configuration for better compatibility.

### 3. Test the Fix

```bash
# Clear cache and restart
npx expo start --clear
```

## Additional Troubleshooting

### If you still get errors:

1. **Clear all caches:**
   ```bash
   npx expo start --clear
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

2. **Check your environment variables:**
   ```bash
   # Make sure your .env file has:
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Use development build instead of Expo Go:**
   ```bash
   # If issues persist, create a development build
   npx expo install expo-dev-client
   npx expo run:ios
   # or
   npx expo run:android
   ```

### Alternative: Use Mock Data

If you want to skip Supabase setup for now, you can continue using the mock data:

1. The app already works with mock authentication and data
2. All features are functional without real backend
3. Perfect for development and demonstration

### Common Error Messages and Solutions

- **"Protocol is not implemented"** → Fixed by URL polyfill
- **"TextEncoder is not defined"** → Fixed by text-encoding polyfill  
- **"crypto.getRandomValues is not a function"** → Fixed by expo-crypto polyfill
- **"Cannot resolve module"** → Fixed by Metro config updates

## Production Considerations

For production apps:

1. Use a development build instead of Expo Go
2. Test thoroughly on actual devices
3. Consider using Expo EAS Build for better compatibility
4. Monitor for any remaining polyfill issues

## Files Modified

- ✅ `App.tsx` - Added polyfill imports
- ✅ `src/polyfills.ts` - New polyfill file
- ✅ `src/services/supabase.ts` - Updated configuration
- ✅ `metro.config.js` - New Metro configuration
- ✅ `package.json` - Added required dependencies

The app should now work without protocol errors! 🚀
