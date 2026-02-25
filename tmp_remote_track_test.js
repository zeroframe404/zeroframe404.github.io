async function run() {
  const loginResponse = await fetch('http://127.0.0.1:8787/api/admin/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      username: 'Daniel',
      password: 'DockSud1945!#!'
    })
  })

  const loginBody = await loginResponse.text()
  console.log(`login_status=${loginResponse.status}`)
  console.log(`login_body=${loginBody}`)

  if (!loginResponse.ok) {
    process.exit(1)
  }

  const setCookie = loginResponse.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';')[0]

  const trackResponse = await fetch('http://127.0.0.1:8787/api/admin/track-view', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie
    },
    body: JSON.stringify({
      section: 'cotizaciones',
      target_id: 'test-cotizacion'
    })
  })

  console.log(`track_status=${trackResponse.status}`)
  console.log(`track_body=${await trackResponse.text()}`)

  process.exit(trackResponse.ok ? 0 : 1)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
