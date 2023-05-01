export enum UtType {
  GET = 'get',
  RPC = 'rpc',
  POST = 'post',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PUBLISH = 'publish',
}

export interface SubscribeResult{
  allTopics: string[]
  subTopics: string[]
}

export interface UnSubscribeResult{
  allTopics: string[]
  unSubTopics: string[]
}
export interface UtResponse {
  id: number
  responseType: UtType
  state: number
  methodName?: string
  result?: any
  error?: string
}

export interface UtRequest {
  id: number
  requestType: UtType
  methodName?: string
  args?: any[]
  dicts?: object
  topics?: string[]
  msg?: any
}

export interface UtRpcPrameter{
  args: any[]
  dicts: object
}

export interface FullRequest extends UtRequest{timeout?: number}

/**
 * FullRequest转UtRequest
 * @param fullrequest
 * @returns
 */
export function fullRequestConvert2UtRequest (fullrequest: FullRequest): UtRequest {
  const copy: FullRequest = JSON.parse(JSON.stringify(fullrequest))
  if (copy.timeout === undefined) {
    return copy
  }
  delete copy.timeout
  return copy
}

export class FutrueError extends Error {
  constructor (err: string) {
    super(err)
    this.name = 'FutrueError'
  }
}

export class Futrue<ReslutType, ErrorType, SourceType=any> {
  public isPending: boolean = true
  private readonly promise: Promise<ReslutType>
  private resolve: (res: ReslutType) => void
  private reject: (err: ErrorType) => void
  public readonly source!: SourceType | undefined
  public result: ReslutType

  constructor (source?: SourceType) {
    this.source = source
    this.promise = new Promise<ReslutType>((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }

  public getSource (): SourceType {
    if (this.source === undefined) throw new FutrueError('<Futrue>: 不能获取source，初始化Futrue时未指定。')
    return this.source
  }

  public async holding (): Promise<ReslutType> {
    if (this.result !== undefined) return this.result
    return await this.promise
  }

  public async getResult (): Promise<ReslutType> {
    if (this.result !== undefined) return this.result
    return await this.promise
  }

  public finally (cb: () => void): void {
    this.promise.finally(() => cb())
  }

  public setError (err: ErrorType): void {
    if (!this.isPending) throw new FutrueError('任务已完成不能重复调用"setError"方法.')
    this.reject(err)
    this.isPending = false
  }

  public setResult (res: ReslutType): void {
    if (!this.isPending) throw new FutrueError('任务已完成不能重复调用"setResult"方法.')
    this.result = res
    this.resolve(res)
    this.isPending = false
  }
}

export class RequestParamError extends Error {
  public readonly request: UtRequest
  constructor (err: string, request: UtRequest) {
    super(err)
    this.name = 'RequestParamError'
    this.request = request
  }
}
export class RequestFaildError extends Error {
  public readonly request: UtRequest
  constructor (err: string, request: UtRequest) {
    super(err)
    this.name = 'RequestFaildError'
    this.request = request
  }
}

export class RequestBreakError extends Error {
  public readonly request: UtRequest
  constructor (err: string, request: UtRequest) {
    super(err)
    this.name = 'RequestBreakError'
    this.request = request
  }
}

export class LoaclWaitTimoutError extends Error {
  constructor (err: string) {
    super(err)
    this.name = 'LoaclWaitTimoutError'
  }
}

export class ConnectionFaildError extends Error {
  constructor (err: string) {
    super(err)
    this.name = 'ConnectionFaildError'
  }
}

function request2Faild (request: FullRequest | UtRequest, errMsg: string): UtResponse {
  let response: UtResponse
  if (request.requestType === UtType.RPC) {
    const { id, requestType, methodName } = request
    response = { id, responseType: requestType, state: 0, methodName, error: errMsg }
  } else {
    const { id, requestType } = request
    response = { id, responseType: requestType, state: 0, error: errMsg }
  }
  return response
}

export class RequestFuture extends Futrue<UtResponse, RequestFaildError | RequestBreakError | RequestParamError, UtRequest> {
  setRequest2Faild (errMsg: string): UtResponse {
    const utRequest = this.getSource()
    const response = request2Faild(utRequest, errMsg)
    this.setResult(response)
    return response
  }
}

export class FullRequestFuture extends Futrue<UtResponse, never, FullRequest> {
  setRequest2Faild (errMsg: string): UtResponse {
    const fullRequest = this.getSource()
    const response = request2Faild(fullRequest, errMsg)
    this.setResult(response)
    return response
  }

  getFullRequest (): FullRequest {
    return this.getSource()
  }

  getUtRequest (): UtRequest {
    return fullRequestConvert2UtRequest(this.getFullRequest())
  }
}

export class UtCache<T> {
  private data: object
  private readonly name: string
  constructor (name: string = 'Cache') {
    this.name = name
    this.data = {}
  }

  push (id: number, value: T): void {
    if (this.data[id] !== undefined) console.warn(`<${this.name}[${id}]>: is overwritten!`)
    this.data[id] = value
  }

  pop (id: number): T | null {
    if (this.data[id] !== undefined) {
      const res = this.data[id]
      delete this.data[id]
      return res
    }
    return null
  }

  getAllData (): T[] {
    return Object.values(this.data)
  }

  clear (): T[] {
    const data = Object.values(this.data)
    this.data = {}
    return data
  }
}

export class FullRequstFutureCache extends UtCache<FullRequestFuture> {
  constructor () {
    super('FullRequstFutureCache')
  }

  /**
   * 将所有的Future设置为失败响应
   * @param errMsg
   * @returns
   */
  setAllRequest2Faild (errMsg: string): void {
    this.clear().forEach((fullRequestFuture) => {
      fullRequestFuture.setRequest2Faild(errMsg)
    })
  }

  getAllUtRequest (): UtRequest[] {
    return this.getAllData().map(fullRequestFuture => {
      return fullRequestFuture.getUtRequest()
    })
  }
}

export type publishCallbackType = (topic: string, msg: any) => void

export enum UtState {
  RUNING = '正常运行中',
  DISCONECTION = '连接断开',
  UN_START = '客户端未启动',
  RECONNECTING = '正在重连中',
  RECONNECT_FAILDE = '重连失败',
  CONNECT_FAILED = '连接服务端失败'
}

export class ClientState {
  private state: UtState
  private extra: string
  constructor (state: UtState, extra: string = '') {
    this.state = state
    this.extra = extra
  }

  public changeState (state: UtState, extra: string = ''): void {
    this.state = state
    this.extra = extra
  }

  public getState (): UtState {
    return this.state
  }

  public getMsg (): string {
    if (this.extra === '') {
      return this.state
    }
    return this.state + ',' + this.extra
  }
}

export class TopicHandlerCollection {
  protected readonly handler: publishCallbackType[] = []
  protected readonly topics: string[] = []

  public add (...items: Array<[string, publishCallbackType]>): void {
    const self = this
    items.forEach(function (e) {
      self.topics.push(e[0])
      self.handler.push(e[1])
    })
  }

  public getCallback (topic: string): publishCallbackType[] {
    const self = this
    return self.handler.filter((_, index) => topic === self.topics[index])
  }

  public getAllTopics (): string[] {
    return this.topics
  }

  public remove (topic: string): void {
    const n = this.topics.length
    const self = this
    for (let i = n - 1; i >= 0; i--) {
      if (self.topics[i] === topic) {
        self.topics.splice(i, 1)
        self.handler.splice(i, 1)
      }
    }
  }
}
