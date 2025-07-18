const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for React Native compatibility
config.resolver.assetExts.push('cjs');

// Configure resolver for better compatibility with supabase
config.resolver.sourceExts.push('cjs');

module.exports = config;
