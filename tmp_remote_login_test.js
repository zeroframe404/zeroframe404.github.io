fetch('http://127.0.0.1:8787/api/admin/login', {
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    username: 'daniel',
    password: 'DockSud1945!#!'
  })
})
  .then(async (response) => {
    const text = await response.text()
    console.log(`status=${response.status}`)
    console.log(`body=${text}`)
    process.exit(response.ok ? 0 : 1)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
