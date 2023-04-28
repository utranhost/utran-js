
export function isErrorInstanceOf<ErrorType extends Error> (error: any, errorType: new (...args) => ErrorType): boolean {
  if (typeof error === 'object' && 'name' in error) {
    if (error.name === errorType.name) return true
    return false
  }
  return false
}

/**
 * 数据转二进制
 * @param data
 * @returns
 */
export function toBuffer (data: any): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(data)).buffer
}

export function isNodePlatform (): boolean {
  return typeof window === 'undefined'
}

function ArrayBufferToString (buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  const json = decoder.decode(buffer)
  return json
}

/**
 * 二进制数据转字符串
 * @param buffer
 * @returns
 */
export function BufferToString (buffer: ArrayBuffer | Buffer | Buffer[] | string): string {
  if (typeof buffer === 'string') return buffer
  if (isNodePlatform()) {
    const d = buffer instanceof ArrayBuffer ? ArrayBufferToString(buffer) : buffer
    const a = d instanceof Buffer ? d.toString() : d instanceof Array ? d.map(v => v.toString()).join('') : d
    return a
  } else {
    const d = buffer instanceof ArrayBuffer ? ArrayBufferToString(buffer) : buffer
    return d as string
  }
}

/**
 * 生成token
 * @param usename
 * @param password
 * @returns
 */
export function basicAuth (usename: string, password: string): string {
  const b = btoa(`${usename}:${password}`)
  return `Basic ${b}`
}
