const NAMESPACE = "codestrata"
const SCHEMA_VERSION = 2

export class RepositoryCache {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage
  }

  cacheKey(owner, repo) {
    return `${NAMESPACE}:v${SCHEMA_VERSION}:repo:${owner}/${repo}`
  }

  save(snapshot) {
    const key = this.cacheKey(snapshot.insight.profile.owner, snapshot.insight.profile.name)
    const envelope = {
      sourceType: "cache",
      sourceName: "本地缓存",
      fetchedAt: snapshot.fetchedAt,
      cacheKey: key,
      schemaVersion: SCHEMA_VERSION,
      insight: snapshot.insight
    }
    try {
      this.storage.setItem(key, JSON.stringify(envelope))
    } catch (error) {
      throw new Error("CACHE_WRITE_FAILED")
    }
    return envelope
  }

  load(owner, repo) {
    const key = this.cacheKey(owner, repo)
    let raw
    try {
      raw = this.storage.getItem(key)
    } catch (error) {
      return null
    }

    if (!raw) return null

    try {
      const parsed = JSON.parse(raw)
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        this.remove(owner, repo)
        return null
      }
      return { ...parsed, sourceType: "cache" }
    } catch (error) {
      this.remove(owner, repo)
      return null
    }
  }

  remove(owner, repo) {
    try {
      this.storage.removeItem(this.cacheKey(owner, repo))
    } catch (error) {
      // removal failure is not blocking; next load will treat it as a miss
    }
  }
}
