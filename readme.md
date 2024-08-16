# CacheManager 库

CacheManager 库是一个灵活且可扩展的缓存解决方案，旨在管理和优化 Web 应用程序的数据存储。它利用浏览器存储机制，如 `localStorage` 和 `sessionStorage`，以高效地缓存数据，并支持插件以扩展功能。

## 特性

- **灵活的存储选项**：可在 `localStorage` 和 `sessionStorage` 之间选择，用于数据持久化。
- **自动缓存过期**：为缓存数据设置过期时间，确保数据的新鲜度。
- **插件系统**：通过自定义插件扩展库的功能。
- **高效的存储管理**：实现最近最少使用（LRU）策略，以保持缓存大小在指定限制以下。
- **序列化和反序列化**：自定义数据存储前的序列化到字符串的方式和检索时的反序列化方式。
- **URL 匹配**：可选地限制只缓存与指定模式匹配的 URL。

## 安装

要在项目中使用 CacheManager 库，请使用 yarn 将其添加到您的项目中：

```bash
yarn add @dada/frontend-cache-manager
```

确保在需要时正确导入它们。

## 使用

### 初始化

```javascript
import { CacheManager } from '@dada/frontend-cache-manager';

const cacheManager = new CacheManager(expiration, options);
```

- `expiration`：（可选）缓存数据的默认过期时间（分钟）。默认为 180 分钟。
- `options`：（可选）一个对象，用于自定义缓存管理器。可用选项包括：
  - `matchText`：一个字符串，用于匹配 URL 进行缓存。
  - `serialize`：一个函数，用于序列化存储前的数据。
  - `deserialize`：一个函数，用于检索时反序列化数据。
  - `storageType`：`'localStorage'` 或 `'sessionStorage'`。默认为 `'sessionStorage'`。

### 添加插件

```javascript
import { TrackEventPlugin } from './path/to/plugins/TrackEventPlugin';

cacheManager.addPlugin(new TrackEventPlugin());
```

### 设置缓存值

```javascript
cacheManager.setCacheValue({
  value: yourData,
  expiration: 60, // 可选，以分钟为单位
  flagKey: 'yourFlagKey' // 可选，用于标识此缓存条目的唯一键
});
```

### 获取缓存值

```javascript
const data = cacheManager.getCacheValue('yourFlagKey');
```

### 清除缓存值

```javascript
cacheManager.clearCacheValue('yourFlagKey');
```

### 页面重新加载时清除缓存

```javascript
const removeListener = cacheManager.clearOnPageReload();
// 当需要时，调用 removeListener() 来分离事件监听器。
```

### 获取缓存统计信息

```javascript
const stats = cacheManager.getCacheStats();
console.log(stats.text);
```

## 使用插件扩展

通过实现 `CachePlugin` 接口创建自定义插件。插件可以定义 `beforeSet`、`afterGet` 和其他生命周期方法，以扩展 CacheManager 的功能。

```javascript
class MyCustomPlugin {
  beforeSet(key, value, flagKey, currentValue) {
    // 设置缓存值之前的自定义逻辑
  }

  afterGet(key, flagKey, value) {
    // 获取缓存值之后的自定义逻辑
  }
}
```

## 贡献

欢迎为 CacheManager 库做出贡献。请确保您的代码遵循项目的编码标准，并为新功能或错误修复包含测试。

## 许可证

MIT