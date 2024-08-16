// 比较算法，比较前一次和这一次缓存值的差异
export function compareValues<T extends Object>(value1: T, value2: T): number {
  if (value1 === value2) {
    return 1
  }

  if (typeof value1 !== typeof value2) {
    return 0
  }

  if (value1 === null || value2 === null) {
    return 0
  }

  if (Array.isArray(value1) && Array.isArray(value2)) {
    const maxLength = Math.max(value1.length, value2.length)
    if (maxLength === 0) {
      return 1
    }
    let similarity = 0
    for (let i = 0; i < maxLength; i++) {
      similarity += compareValues(value1[i] ?? null, value2[i] ?? null)
    }
    return similarity / maxLength
  }

  if (typeof value1 === 'object') {
    const keys1 = Object.keys(value1)
    const keys2 = Object.keys(value2)
    const allKeys = new Set<string>([...keys1, ...keys2])
    let similarity = 0
    allKeys.forEach((key) => {
      similarity += compareValues((value1 as any)[key], (value2 as any)[key])
    })
    return similarity / allKeys.size
  }

  if (Number.isNaN(value1) && Number.isNaN(value2)) {
    return 0
  }

  return 0
}

export function isCacheValid<T extends Object>(
  oldValue: T,
  newValue: T
): boolean {
  const similarity = compareValues(oldValue, newValue)
  return similarity >= 0.5
}
