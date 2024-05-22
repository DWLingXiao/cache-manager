import { CachePlugin } from '../types'
import { isCacheValid } from '../utils'

export class TrackEventPlugin implements CachePlugin {
  beforeSet(key: string, value: any, flagKey: string, currentValue: any): void {
    let isValid = false
    const BOOMR_mq = (window as any)?.BOOMR_mq
    if (value?.formValue && currentValue?.formValue) {
      isValid = isCacheValid(value.formValue, currentValue.formValue)
    } else {
      isValid = isCacheValid(value, currentValue)
    }
    if (BOOMR_mq) {
      BOOMR_mq.push([
        'addVar',
        'portal_click_search',
        1,
        true,
      ])
    }
    if (isValid) {
      if (BOOMR_mq) {
        BOOMR_mq.push([
          'addVar',
          'portal_valid_cache',
          1,
          true,
        ])
      }
    }
    return
  }

  afterGet(key: string, flagKey: string, value: any): void {
    return
  }
}
