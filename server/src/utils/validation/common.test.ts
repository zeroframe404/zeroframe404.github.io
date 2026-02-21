// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizeLimit } from './common.js'

describe('normalizeLimit', () => {
  it('returns default limit for invalid values', () => {
    expect(normalizeLimit(undefined)).toBe(500)
    expect(normalizeLimit('abc')).toBe(500)
    expect(normalizeLimit(0)).toBe(500)
    expect(normalizeLimit(-10)).toBe(500)
  })

  it('caps limit to max value', () => {
    expect(normalizeLimit(2000)).toBe(1000)
  })

  it('returns parsed numeric value', () => {
    expect(normalizeLimit('300')).toBe(300)
  })
})
