// Test script to check Sepay transactions
const fetch = require('node-fetch');

async function testSepayTransactions() {
  const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://my.sepay.vn';
  const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY;
  
  if (!SEPAY_SECRET_KEY) {
    console.error('❌ SEPAY_SECRET_KEY not found in environment');
    return;
  }

  console.log('🔍 Testing Sepay API connection...');
  console.log('API URL:', SEPAY_API_URL);
  console.log('Secret Key:', SEPAY_SECRET_KEY ? '***' + SEPAY_SECRET_KEY.slice(-4) : 'NOT SET');

  try {
    const response = await fetch(`${SEPAY_API_URL}/userapi/transactions/list?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SEPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received');
    console.log('📊 Total transactions:', data.transactions?.length || 0);
    
    if (data.transactions && data.transactions.length > 0) {
      console.log('\n🏦 Recent transactions:');
      data.transactions.slice(0, 5).forEach((tx, index) => {
        console.log(`${index + 1}. Amount: ${tx.amount_in} VND`);
        console.log(`   Description: "${tx.transaction_content}"`);
        console.log(`   Date: ${tx.transaction_date}`);
        console.log(`   Bank: ${tx.bank_brand_name}`);
        console.log(`   Account: ${tx.account_number}`);
        console.log('   ---');
      });
      
      // Look for our specific order ID
      const orderIds = ['PHO_SUB_1759161911952_19APV7', 'PHO_SUB_1759160328039_MI8WLV'];
      console.log('\n🔍 Searching for our order IDs...');
      
      orderIds.forEach(orderId => {
        const found = data.transactions.find(tx => 
          tx.transaction_content && tx.transaction_content.includes(orderId)
        );
        
        if (found) {
          console.log(`✅ FOUND: ${orderId}`);
          console.log(`   Amount: ${found.amount_in} VND`);
          console.log(`   Description: "${found.transaction_content}"`);
          console.log(`   Date: ${found.transaction_date}`);
        } else {
          console.log(`❌ NOT FOUND: ${orderId}`);
        }
      });
    } else {
      console.log('📭 No transactions found');
    }

  } catch (error) {
    console.error('💥 Error testing Sepay API:', error.message);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testSepayTransactions();
