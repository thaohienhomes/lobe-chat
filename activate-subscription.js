// Manual subscription activation script
const fetch = require('node-fetch');

async function activateSubscription() {
  const orderId = 'PHO_SUB_1759161911952_19APV7';
  const amount = 29000;
  
  console.log('🚀 Activating subscription manually...');
  console.log('Order ID:', orderId);
  console.log('Amount:', amount, 'VND');
  
  try {
    // Test if server is running
    console.log('📡 Testing server connection...');
    const testResponse = await fetch('http://localhost:3010/api/payment/sepay/status?orderId=' + orderId + '&amount=' + amount);
    
    if (!testResponse.ok) {
      console.error('❌ Server not accessible. Make sure the development server is running.');
      console.error('Run: bun run dev');
      return;
    }
    
    console.log('✅ Server is running');
    
    // Try manual verification
    console.log('🔧 Attempting manual verification...');
    
    const verifyResponse = await fetch('http://localhost:3010/api/payment/sepay/verify-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount
      })
    });
    
    console.log('Response status:', verifyResponse.status);
    
    if (verifyResponse.ok) {
      const result = await verifyResponse.json();
      console.log('✅ SUCCESS! Subscription activated');
      console.log('Result:', result);
      console.log('🎉 You can now refresh your payment page - it should redirect to success!');
    } else {
      const errorText = await verifyResponse.text();
      console.log('❌ Manual verification failed');
      console.log('Error:', errorText);
      
      // Alternative: Direct database update (if needed)
      console.log('💡 Alternative: Use the manual verification button on the payment page');
      console.log('   Or wait for the Sepay webhook to arrive');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. Development server is running (bun run dev)');
    console.log('   2. You are in the correct directory');
    console.log('   3. The payment was made to MBBank account 12919899999');
  }
}

// Check if node-fetch is available
try {
  require('node-fetch');
} catch (e) {
  console.log('📦 Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' });
}

activateSubscription();
