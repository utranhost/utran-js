import { RequestParamError, UtRequest, UtRpcPrameter, UtType } from './object'

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

/**
 * 生成区间范围内的一维数组
 * @param stop
 * @param start
 * @param step
 * @returns
 */
export function range (stop: number, start: number = 0, step: number = 1): number[] {
  if (stop < start) {
    const _start = stop
    stop = start
    start = _start
  }
  const array: number[] = []
  for (let i = start; i < stop; i += step) {
    array.push(i)
  }
  return array
}

/**
 * 参数解构,返回请求所需的参数,args和dicts
 * @param params
 * @returns
 */
export function ParameterDeconstruction (...params: any[]): UtRpcPrameter {
  const p = { ...params }
  const keys = Object.keys(p)
  const args: any[] = []
  const dicts: object = {}
  keys.forEach((key, index) => {
    const param = p[key]
    if (parseInt(key) === index) {
      if (typeof param === 'object') {
        Object.assign(dicts, param)
      } else {
        args.push(param)
      }
    } else {
      dicts[key] = param
    }
  })
  return { args, dicts }
}

const UtTypeValues = Object.values(UtType)
/**
 * 检查请求体
 * @param request
 * @returns
 */
export function checkRequstIsError (request: UtRequest): RequestParamError | null {
  if (typeof request.id !== 'number') {
    return new RequestParamError('请求体必需包含"id"字段,且必须是number', request)
  }
  if (!UtTypeValues.includes(request.requestType)) {
    return new RequestParamError(`请求体必需包含"requestType"字段,且值必须是[${UtTypeValues.toString()}]其中之一.`, request)
  }
  const requestType = request.requestType
  if (requestType === UtType.RPC) {
    if (!('methodName' in request)) {
      return new RequestParamError(`${UtType.RPC}请求必须有"methodName"字段.`, request)
    }
    if (!('args' in request)) {
      return new RequestParamError(`${UtType.RPC}请求必须有"args"字段.`, request)
    }
    if (!('dicts' in request)) {
      return new RequestParamError(`${UtType.RPC}请求必须有"dicts"字段.`, request)
    }
    return null
  } else if ((requestType === UtType.SUBSCRIBE) || (requestType === UtType.UNSUBSCRIBE)) {
    if (!('topics' in request)) {
      return new RequestParamError(`${request.requestType}请求必须有"topics"字段.`, request)
    }
    return null
  }
  return null
}
