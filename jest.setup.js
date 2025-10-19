// Jest setup for global test configuration
import '@testing-library/jest-dom'

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'