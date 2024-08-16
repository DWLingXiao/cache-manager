import { CachePlugin } from '../types'
import { isCacheValid } from '../utils'

export class TrackEventPlugin implements CachePlugin {
  beforeSet(key: string, value: any, flagKey: string, currentValue: any): void {
    return
  }

  afterGet(key: string, flagKey: string, value: any): void {
    return
  }
}
