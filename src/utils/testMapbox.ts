// Utility to test Mapbox configuration
export const testMapboxConnection = () => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  console.log('=== Mapbox Configuration Test ===');
  
  if (!mapboxToken) {
    console.error('❌ VITE_MAPBOX_ACCESS_TOKEN is not set in .env file');
    console.log('📝 Add this to your .env file:');
    console.log('   VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here');
    console.log('🔗 Get your token from: https://account.mapbox.com/access-tokens/');
    return false;
  }
  
  if (mapboxToken === 'pk.your-token-here' || mapboxToken.startsWith('pk.your')) {
    console.warn('⚠️  Mapbox token appears to be a placeholder');
    console.log('📝 Replace with your actual token from: https://account.mapbox.com/access-tokens/');
    return false;
  }
  
  if (!mapboxToken.startsWith('pk.')) {
    console.warn('⚠️  Mapbox token should start with "pk." (public token)');
    return false;
  }
  
  console.log('✅ Mapbox token found:', mapboxToken.substring(0, 10) + '...');
  console.log('✅ Token format looks correct');
  
  // Test a simple API call
  const testUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-1.2921,36.8219,17/256x256@2x?access_token=${mapboxToken}`;
  console.log('🧪 Testing API call...');
  
  fetch(testUrl)
    .then(response => {
      if (response.ok) {
        console.log('✅ Mapbox API is working correctly!');
        return true;
      } else if (response.status === 401) {
        console.error('❌ Invalid Mapbox token (401 Unauthorized)');
        console.log('📝 Please check your token at: https://account.mapbox.com/access-tokens/');
        return false;
      } else {
        console.warn(`⚠️  Unexpected response: ${response.status}`);
        return false;
      }
    })
    .catch(error => {
      console.error('❌ Error testing Mapbox API:', error.message);
      return false;
    });
  
  return true;
};

