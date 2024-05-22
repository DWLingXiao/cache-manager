export interface CacheOptions {
  matchText?: string
  serialize?: (value: any) => string
  deserialize?: (text: string) => any
  storageType?: StorageType
}

export interface CachePlugin {
  beforeSet?: (key: string, value: any, flagKey: string, currentValue: any) => void
  afterGet?: (key: string, flagKey: string, value: any) => void
}

export type StorageType = 'sessionStorage' | 'localStorage'
