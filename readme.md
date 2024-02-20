# CacheManager

CacheManager 是一个用于管理前端缓存的 JavaScript 类。它提供了一系列方法来存储、检索和清除缓存数据，支持使用 `localStorage` 或 `sessionStorage` 作为存储介质，并实现了简单的 LRU (Least Recently Used) 缓存淘汰策略。

## 特性

- 支持自定义缓存过期时间
- 支持自定义序列化和反序列化方法
- 可选使用 `localStorage` 或 `sessionStorage`
- 自动执行 LRU 缓存淘汰策略
- 支持按 URL 匹配缓存
- 提供缓存统计信息

## 使用方法

首先，你需要导入 `CacheManager` 类并创建一个实例：

```javascript
import { cacheManager } from 'cache-manager';

const options = {
  matchText: 'example.com', // 自定义匹配文本
  serialize: customSerializeFunction, // 自定义序列化函数
  deserialize: customDeserializeFunction, // 自定义反序列化函数
  isUseLoaclStorage: true, // 是否使用 localStorage，默认为 false
};

const myCache = cacheManager(180, options); // 缓存过期时间(默认180分钟)，配置项(option)
```

### 设置缓存

```javascript
myCache.setCacheValue({
  value: 'some data',
  expiration: 300, // 可选，单位为分，默认为构造函数中设置的值
  flagKey: 'uniqueKey', // 可选，默认为 'default'
});
```

### 获取缓存

```javascript
const cachedData = myCache.getCacheValue('uniqueKey');
```

### 清除缓存

```javascript
myCache.clearCacheValue('uniqueKey'); // 清除特定键的缓存
myCache.clearCacheValue(); // 清除所有缓存
```

### 缓存统计

```javascript
const stats = myCache.getCacheStats();
console.log(stats.text);
```

### 页面重载时清除缓存

```javascript
myCache.clearOnPageReload();
```

## 注意事项

- 缓存管理器默认匹配的文本是 'imdada.cn'，你可以通过 `options.matchText` 来自定义。
- 默认的序列化和反序列化方法是 `JSON.stringify` 和 `JSON.parse`，你可以通过 `options.serialize` 和 `options.deserialize` 来自定义。
- 缓存大小限制默认为 4MB，超过这个大小时将触发 LRU 淘汰策略。

## 贡献

如果你有任何建议或改进，请提交 Pull Request 或创建 Issue。

## 许可证

本项目采用 ISC 许可证。有关更多信息，请查看项目中的 LICENSE 文件。
