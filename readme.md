# CacheManager

## 简介

`CacheManager` 是一个基于 JavaScript 的轻量级缓存库，旨在帮助开发者更轻松地管理网站或应用中的缓存数据。它支持多种存储类型（包括 `sessionStorage` 和 `localStorage`），并且允许注册自定义插件以扩展其功能。

## 安装

```bash
npm install cachemanager
```

## 使用

首先，你需要创建一个新的 `CacheManager` 实例，并传入所需的参数：

```javascript
import CacheManager from 'cachemanager';

const cacheManager = new CacheManager(180, {
  matchText: 'example.com',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  storageType: 'sessionStorage',
});
```

然后，你可以通过以下方式设置和获取缓存数据：

```javascript
// 设置缓存数据
cacheManager.setCacheValue({
  value: 'Hello, World!',
  expiration: 5, // 5分钟
});

// 获取缓存数据
const cachedValue = cacheManager.getCacheValue();
console.log(cachedValue); // 输出：Hello, World!
```

此外，`CacheManager` 还提供了其他一些实用的方法，如检查缓存是否过期、清除缓存数据等。

## 插件

`CacheManager` 支持注册自定义插件来扩展其功能。例如，你可以编写一个插件来记录每次缓存操作的日志信息：

```javascript
import { TrackEventPlugin } from 'cachemanager';

class LogPlugin implements CachePlugin {
  beforeSet(key: string, value: any, flagKey: string, currentValue: any) {
    console.log(`Setting cache "${key}" with value "${value}"`);
  }

  afterGet(key: string, flagKey: string, value: any) {
    console.log(`Getting cache "${key}" with value "${value}"`);
  }
}

cacheManager.addPlugin(new LogPlugin());
```

## 示例

下面是一个简单的示例，展示了如何使用 `CacheManager` 来管理缓存数据：

```javascript
import CacheManager from 'cachemanager';
import { LogPlugin } from 'cachemanager';

const cacheManager = new CacheManager(180, {
  matchText: 'example.com',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  storageType: 'sessionStorage',
});

cacheManager.addPlugin(new LogPlugin());

// 设置缓存数据
cacheManager.setCacheValue({
  value: 'Hello, World!',
  expiration: 300, // 5分钟
});

// 获取缓存数据
const cachedValue = cacheManager.getCacheValue();
console.log(cachedValue); // 输出：Hello, World!

// 清除缓存数据
cacheManager.clearCacheValue();

// 检查缓存状态
console.log(cacheManager.getCacheStats()); // 输出当前缓存状态
```

## 贡献

如果你有任何建议或发现任何问题，请随时在 GitHub 上提交 [Issue](https://github.com/DWLingXiao/cache-manager/issues) 或者 [Pull Request](https://github.com/DWLingXiao/cache-manager/pulls)。


