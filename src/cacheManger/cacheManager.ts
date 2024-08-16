import { TrackEventPlugin } from '../plugins/TrackEventPlugin'
import { CacheOptions, CachePlugin, StorageType } from '../types/index'
import { CACHE_MATCH_TEXT, DEFAULT_FLAG_KEY } from './constants'
class CacheManager {
  private defaultExpiration: number
  private matchText: string
  private serialize: (value: any) => string
  private deserialize: (text: string) => any
  private storageType: StorageType
  private plugins: CachePlugin[] = []

  constructor(
    expiration: number = 180,
    options: CacheOptions = {
      matchText: undefined,
      serialize: undefined,
      deserialize: undefined,
      storageType: 'sessionStorage',
    }
  ) {
    this.defaultExpiration = expiration
    this.matchText = options.matchText || CACHE_MATCH_TEXT
    this.serialize = options.serialize || JSON.stringify
    this.deserialize = options.deserialize || JSON.parse
    this.storageType = options.storageType || 'sessionStorage'
    this.addPlugin(new TrackEventPlugin());
  }
  

  // 注册插件
  public addPlugin(plugin: CachePlugin): void {
    this.plugins.push(plugin)
  }

  // 在设置缓存之前执行插件的beforeSet方法
  private executeBeforeSet(
    key: string,
    value: any,
    flagKey: string,
    currentValue?: any
  ): void {
    this.plugins.forEach((plugin) => {
      if (plugin.beforeSet) {
        plugin.beforeSet(key, value, flagKey, currentValue)
      }
    })
  }

  // 在获取缓存之前执行插件的beforeGet方法
  private executeAfterGet(key: string, flagKey: string, value: any): void {
    this.plugins.forEach((plugin) => {
      if (plugin.afterGet) {
        plugin.afterGet(key, flagKey, value)
      }
    })
  }

  private get storage(): Storage {
    if (typeof window === 'undefined') {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      } as unknown as Storage
    }
    switch (this.storageType) {
      case 'sessionStorage':
        return window.sessionStorage
      case 'localStorage':
        return window.localStorage
      default:
        return window.sessionStorage
    }
  }

  private _getByteSize(str: string): number {
    if (typeof Blob === 'function') {
      return new Blob([str]).size
    } else if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(str).length
    } else {
      return str.length
    }
  }

  private _checkUrlPresence(text: string | null): boolean {
    return text ? `${text}`.includes(this.matchText) : false
  }

  private _LRU(): void {
    const maxCacheSize = 4 * 1024 * 1024
    let totalSize = this.getCacheStats().totalSize

    if (totalSize <= maxCacheSize) {
      return
    }

    const cacheItems: { key: string; size: number; lastAccessed: number }[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && this._checkUrlPresence(key)) {
        const cacheEntryRaw = this.storage.getItem(key)
        if (cacheEntryRaw) {
          const cacheEntry = this.deserialize(cacheEntryRaw)
          let earliestLastAccessed = Number.MAX_SAFE_INTEGER
          Object.values(cacheEntry).forEach((entry: any) => {
            if (entry.lastAccessed < earliestLastAccessed) {
              earliestLastAccessed = entry.lastAccessed
            }
          })
          cacheItems.push({
            key,
            size: this._getByteSize(cacheEntryRaw),
            lastAccessed: earliestLastAccessed,
          })
        }
      }
    }
    cacheItems.sort((a, b) => a.lastAccessed - b.lastAccessed)

    while (totalSize > maxCacheSize && cacheItems.length > 0) {
      const oldestItem = cacheItems.shift()
      if (oldestItem) {
        this.storage.removeItem(oldestItem.key)
        totalSize -= oldestItem.size
      }
    }
  }

  public getCacheKey(): string {
    return `${window.location.href}_${CACHE_MATCH_TEXT}`
  }

  public isCacheExpired(lastAccessed: number, expiration: number): boolean {
    return Date.now() - lastAccessed > expiration
  }

  public setCacheValue({
    value,
    expiration = this.defaultExpiration,
    flagKey = DEFAULT_FLAG_KEY,
  }: {
    value: any
    expiration?: number
    flagKey?: string
  }): void {
    const key = this.getCacheKey()
    let currentValue: any = null
    try {
      const existingCacheRaw = this.getCacheValue(flagKey)
      if (existingCacheRaw) {
        currentValue = existingCacheRaw
      }
    } catch (e) {
      console.log(`CacheManager: 获取上次缓存失败 ${e}`)
    }
    // 设置前插件执行
    this.executeBeforeSet(key, value, flagKey, currentValue)
    let cacheValue: any = {
      value: value,
      createTime: Date.now(),
      lastAccessed: Date.now(),
      expiration: expiration * 60 * 1000,
    }

    try {
      const existingCacheRaw = this.storage.getItem(key)
      if (existingCacheRaw) {
        const existingCache = this.deserialize(existingCacheRaw)
        existingCache[flagKey] = cacheValue
        cacheValue = existingCache
      } else {
        cacheValue = { [flagKey]: cacheValue }
      }
      this.storage.setItem(key, this.serialize(cacheValue))
      this._LRU()
    } catch (e) {
      console.error('Failed to set cache value:', e)
    }
  }

  public getCacheValue(flagKey: string = DEFAULT_FLAG_KEY): any {
    const key = this.getCacheKey()

    try {
      const cacheValueRaw = this.storage.getItem(key)
      if (!cacheValueRaw) {
        return
      }

      const parsedValue = this.deserialize(cacheValueRaw)
      const cacheEntry = parsedValue[flagKey]
      if (!cacheEntry) {
        return
      }

      const { value, lastAccessed, expiration } = cacheEntry
      if (
        this.isCacheExpired(lastAccessed, expiration) &&
        this.storage === sessionStorage
      ) {
        this.clearCacheValue(flagKey)
        return
      }

      cacheEntry.lastAccessed = Date.now()
      this.storage.setItem(key, this.serialize(parsedValue))
      // 获取前插件执行
      this.executeAfterGet(key, flagKey, value)
      return value
    } catch (e) {
      console.error('获取当前缓存数据失败', e)
      return
    }
  }

  public clearCacheValue(flagKey: string = DEFAULT_FLAG_KEY): void {
    const key = this.getCacheKey()
    try {
      if (!flagKey || flagKey === DEFAULT_FLAG_KEY) {
        this.storage.removeItem(key)
      } else {
        const cacheValueRaw = this.storage.getItem(key)
        if (cacheValueRaw) {
          const parsedValue = this.deserialize(cacheValueRaw)
          delete parsedValue[flagKey]
          if (Object.keys(parsedValue).length === 0) {
            this.storage.removeItem(key)
          } else {
            this.storage.setItem(key, this.serialize(parsedValue))
          }
        }
      }
    } catch (e) {
      console.error('清除缓存数据失败', e)
    }
  }

  public clearOnPageReload(): () => void {
    if (this.storage !== sessionStorage) {
      return () => {}
    }
    const handleBeforeUnload = () => {
      const key = this.getCacheKey()
      const cacheValueRaw = this.storage.getItem(key)
      if (cacheValueRaw !== null) {
        this.storage.removeItem(key)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }

  public getCacheStats(): {
    itemCount: number
    totalSize: number
    filteredSize: number // 新增属性，用于输出 _checkUrlPresence 下的大小
    text: string
  } {
    let itemCount = 0
    let totalSize = 0
    let filteredSize = 0

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key) {
        const cacheEntry = this.storage.getItem(key)
        if (cacheEntry) {
          const entrySize = this._getByteSize(cacheEntry)
          totalSize += entrySize

          if (this._checkUrlPresence(key)) {
            itemCount++
            filteredSize += entrySize
          }
        }
      }
    }
    return {
      itemCount: itemCount,
      totalSize: totalSize,
      filteredSize: filteredSize,
      text: `当前一共存储${itemCount}条匹配缓存数据，匹配数据共占用${filteredSize}字节，总共占用${totalSize}字节`,
    }
  }
}

export { CacheManager }
