async function testAPI() {
  console.log('🔍 Testing /api/settings endpoint...\n')

  try {
    const response = await fetch('http://localhost:3001/api/settings', {
      headers: {
        'Cookie': 'next-auth.session-token=test' // simulando autenticación
      }
    })

    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('\n📦 Response data:')
    console.log(JSON.stringify(data, null, 2))

    if (typeof data === 'object' && !Array.isArray(data)) {
      console.log('\n📊 Categories found:')
      for (const [category, items] of Object.entries(data)) {
        console.log(`  - ${category}: ${Array.isArray(items) ? items.length : 'N/A'} items`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAPI()
