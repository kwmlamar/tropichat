export default function TestPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Test Page</h1>
      <p>If you can see this, routing is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
