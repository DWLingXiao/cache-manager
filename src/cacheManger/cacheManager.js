class CacheManager {
  constructor(
    expiration = 180,
    // 配置选项参数
    options = {
      matchText: null,
      serialize: null,
      deserialize: null,
      isUseLoaclStorage: false,
    }
  ) {
    this.defaultExpiration = expiration * 60 * 1000

    // 自定义序列化方法
    this.matchText = options.matchText || 'imdada.cn'
    this.serialize = options.serialize || JSON.stringify
    this.deserialize = options.deserialize || JSON.parse
    this.storage = options.isUseLoaclStorage ? localStorage : sessionStorage
  }

  _getByteSize(str) {
    if (typeof Blob === 'function') {
      return new Blob([str]).size;
    } else if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(str).length;
    } else {
      // 简单的估算，每个字符计算为1字节
      return str.length;
    }
  }

  _checkUrlPresence(text) {
    return text ? `${text}`.includes(this.matchText) : false;
  }

  _LRU() {
    const maxCacheSize = 4 * 1024 * 1024 // 4MB
    let { totalSize } = this.getCacheStats()

    if (totalSize <= maxCacheSize) {
      return // 缓存大小未超过限制，无需执行淘汰操作
    }

    // 获取所有缓存项并按最后访问时间排序
    const cacheItems = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (this._checkUrlPresence(key)) {
        const cacheEntryRaw = this.storage.getItem(key)
        const cacheEntry = this.deserialize(cacheEntryRaw)
        // 计算每个缓存项的大小和最早的lastAccessed时间
        let earliestLastAccessed = Number.MAX_SAFE_INTEGER
        Object.values(cacheEntry).forEach((entry) => {
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
    cacheItems.sort((a, b) => a.lastAccessed - b.lastAccessed)

    // 淘汰最老的缓存项直到缓存大小小于限制
    while (totalSize > maxCacheSize && cacheItems.length > 0) {
      const oldestItem = cacheItems.shift()
      this.storage.removeItem(oldestItem.key)
      totalSize -= oldestItem.size
    }
  }

  getCacheKey() {
    return window.location.href
  }

  // 判断是否过期
  isCacheExpired(lastAccessed, expiration) {
    return Date.now() - lastAccessed > expiration;
  }

  setCacheValue({
    value,
    expiration = this.defaultExpiration,
    flagKey = 'default', // 添加flagKey参数，默认值为'default'
  }) {
    const key = this.getCacheKey()
    let cacheValue = {
      value: value,
      createTime: Date.now(),
      lastAccessed: Date.now(),
      expiration: expiration,
    }

    try {
      // 检查是否存在当前URL的缓存值
      const existingCacheRaw = this.storage.getItem(key)
      if (existingCacheRaw) {
        // 如果存在，解析现有缓存值并更新
        const existingCache = this.deserialize(existingCacheRaw)
        existingCache[flagKey] = cacheValue // 添加或更新flagKey属性
        cacheValue = existingCache // 更新cacheValue为整个缓存对象
      } else {
        // 如果不存在，创建一个新的缓存对象
        cacheValue = { [flagKey]: cacheValue }
      }
      // 设置缓存值
      this.storage.setItem(key, this.serialize(cacheValue))
      this._LRU()
    } catch (e) {
      console.error('Failed to set cache value:', e)
    }
  }

  getCacheValue(flagKey = 'default') {
    const key = this.getCacheKey()
    try {
      const cacheValueRaw = this.storage.getItem(key)
      if (!cacheValueRaw) {
        return null
      }

      const parsedValue = this.deserialize(cacheValueRaw)
      // 检查是否存在flagKey对应的缓存值
      const cacheEntry = parsedValue[flagKey]
      if (!cacheEntry) {
        return null
      }

      const { value, lastAccessed, expiration } = cacheEntry
      if (
        this.isCacheExpired(lastAccessed, expiration) &&
        this.storage === sessionStorage
      ) {
        this.clearCacheValue(flagKey)
        return null
      }

      // 更新最后访问时间
      cacheEntry.lastAccessed = Date.now()
      // 保存更新后的缓存值
      this.storage.setItem(key, this.serialize(parsedValue))

      return value
    } catch (e) {
      console.error('获取当前缓存数据失败', e)
      return null
    }
  }

  clearCacheValue(flagKey = 'default') {
    const key = this.getCacheKey()
    try {
      // 如果没有提供特定的flagKey，或者flagKey为'default'，则移除整个缓存对象
      if (!flagKey || flagKey === 'default') {
        this.storage.removeItem(key)
      } else {
        // 如果提供了特定的flagKey，只移除该flagKey对应的缓存值
        const cacheValueRaw = this.storage.getItem(key)
        if (cacheValueRaw) {
          const parsedValue = this.deserialize(cacheValueRaw)
          // 删除指定的flagKey属性
          delete parsedValue[flagKey]
          // 如果缓存对象为空，则移除整个缓存对象，否则保存更新后的缓存对象
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

  clearOnPageReload() {
    if (this.storage !== sessionStorage) {
      return
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

  // 获取当前缓存大小
  getCacheStats() {
    let itemCount = 0
    let totalSize = 0

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (this._checkUrlPresence(key)) {
        itemCount++
        const cacheEntry = this.storage.getItem(key)
        totalSize += this._getByteSize(cacheEntry)
      }
    }

    return {
      itemCount: itemCount,
      totalSize: totalSize,
      text: `当前一共存储${itemCount}条缓存数据，共占用${totalSize}字节`,
    }
  }
}

export const cacheManager = (expiration, options) => {
  return new CacheManager(expiration, options)
}
