export enum UtType {
  GET = 'get',
  RPC = 'rpc',
  POST = 'post',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PUBLISH = 'publish',
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
  private result: ReslutType

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
  public readonly request: UtRequest
  constructor (err: string, request: UtRequest) {
    super(err)
    this.name = 'LoaclWaitTimoutError'
    this.request = request
  }
}

export class ConnectionFaildError extends Error {
  constructor (err: string) {
    super(err)
    this.name = 'ConnectionFaildError'
  }
}

export class RequestFuture extends Futrue<UtResponse, RequestFaildError | RequestBreakError | LoaclWaitTimoutError, UtRequest> {}

export class ResultQue {
  private data: object
  constructor () {
    this.data = {}
  }

  push (...requestFuture: RequestFuture[]): void {
    requestFuture.forEach((r) => {
      const id = r.getSource().id
      if (this.data[id] !== undefined) console.warn(`<ResultQue>:requestFuture[${id}] is overwritten`)
      this.data[id] = r
    })
  }

  pop (id: number): RequestFuture | null {
    if (this.data[id] !== undefined) {
      const res = this.data[id]
      delete this.data[id]
      return res
    }
    return null
  }

  getAllData (): RequestFuture[] {
    return Object.values(this.data)
  }

  clear (): RequestFuture[] {
    const data = Object.values(this.data)
    this.data = {}
    return data
  }
}

export type publishCallbackType = (topic: string, msg: any) => void
