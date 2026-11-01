import assert from "node:assert/strict"
import test from "node:test"
import { RepositoryCache } from "../../app/scripts/cache.js"

class MemoryStorage {
  constructor() {
    this.values = new Map()
  }

  getItem(key) {
    return this.values.get(key) ?? null
  }

  setItem(key, value) {
    this.values.set(key, value)
  }

  removeItem(key) {
    this.values.delete(key)
  }
}

function createSnapshot() {
  return {
    sourceType: "live",
    sourceName: "GitHub 实时数据",
    fetchedAt: "2026-11-01T12:00:00Z",
    schemaVersion: 2,
    insight: {
      profile: { owner: "demo", name: "strata-kit" }
    }
  }
}

test("cache saves a versioned repository snapshot and returns it as cache", () => {
  const storage = new MemoryStorage()
  const cache = new RepositoryCache(storage)

  const saved = cache.save(createSnapshot())
  const loaded = cache.load("demo", "strata-kit")

  assert.equal(saved.cacheKey, "codestrata:v2:repo:demo/strata-kit")
  assert.equal(loaded.sourceType, "cache")
  assert.equal(loaded.fetchedAt, "2026-11-01T12:00:00Z")
  assert.equal(loaded.insight.profile.name, "strata-kit")
})

test("cache treats corrupt JSON as a miss and removes the unusable entry", () => {
  const storage = new MemoryStorage()
  const cache = new RepositoryCache(storage)
  const key = "codestrata:v2:repo:demo/strata-kit"
  storage.setItem(key, "{broken-json")

  assert.equal(cache.load("demo", "strata-kit"), null)
  assert.equal(storage.getItem(key), null)
})

test("cache rejects and removes snapshots from another schema version", () => {
  const storage = new MemoryStorage()
  const cache = new RepositoryCache(storage)
  const key = "codestrata:v2:repo:demo/strata-kit"
  storage.setItem(key, JSON.stringify({
    ...createSnapshot(),
    schemaVersion: 99
  }))

  assert.equal(cache.load("demo", "strata-kit"), null)
  assert.equal(storage.getItem(key), null)
})
