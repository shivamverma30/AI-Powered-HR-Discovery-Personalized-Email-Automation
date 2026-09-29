import { createApp } from './app.js'
import { config, assertConfig } from './config.js'

// Warn early if required auth secrets are missing.
assertConfig()

const app = createApp()

app.listen(config.port, () => {
  console.log(`HireReach AI API running on port ${config.port}`)
})
