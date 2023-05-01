import { UtType, UtRequest, Futrue, FullRequestFuture, UtResponse, ClientState, FullRequstFutureCache, UtState, FullRequest, TopicHandlerCollection, SubscribeResult, RequestParamError, LoaclWaitTimoutError } from '../object'
import { basicAuth, isErrorInstanceOf, parameterDeconstruction } from '../utils'
import { BreakErrorMsg, UtSocket } from './socket'

export class BaseClient {
  private socket: UtSocket
  private readonly url: string
  private requestId: number = 0
  private reconnectFuture: Futrue<boolean, never, never>
  protected readonly fullRequstFutureCache: FullRequstFutureCache = new FullRequstFutureCache()
  private readonly maxReconnectNum: number
  private readonly state: ClientState = new ClientState(UtState.UN_START)
  private readonly topicHandlers: TopicHandlerCollection = new TopicHandlerCollection()

  constructor (url: string, username: string = 'utranhost', password: string = 'utranhost', maxReconnectNum: number = 32) {
    const token = basicAuth(username, password)
    this.url = `${url}?Authorization=${token}`
    this.socket = new UtSocket(this.url, this.onDisconnect.bind(this), this.onPublish.bind(this))
    this.maxReconnectNum = maxReconnectNum
  }

  public async start (): Promise<boolean> {
    try {
      await this.socket.start()
      this.state.changeState(UtState.RUNING)
      return true
    } catch (error) {
      this.state.changeState(UtState.CONNECT_FAILED, error)
      return false
    }
  }

  public genRequestId (): number {
    this.requestId++
    return this.requestId
  }

  private onDisconnect (isSafeExit: boolean, reconnectNum: number = 0): void {
    const self = this
    const faildRequest = self.fullRequstFutureCache.getAllUtRequest()
    self.reconnectFuture = new Futrue<boolean, never, never>()
    if (isSafeExit) {
      // 安全退出
      self.state.changeState(UtState.RECONNECT_FAILDE)
      self.fullRequstFutureCache.setAllRequest2Faild('请求发送失败，原因:执行安全退出')
      self.reconnectFuture.setResult(false)
      return
    }

    console.warn(`尝试重连:${reconnectNum}/${self.maxReconnectNum}`)
    self.state.changeState(UtState.DISCONECTION)
    new UtSocket(this.url, this.onDisconnect.bind(this), this.onPublish.bind(this)).start()
      .then(socket => {
      // 重连成功
        self.socket = socket
        self.state.changeState(UtState.RUNING)
        // 重新订阅
        self.reSubscribe().finally(() => {})
        // 重新发起请求
        faildRequest.forEach(request => {
          socket.send(request)
            .then(response => {
            // 请求发送成功
              self.state.changeState(UtState.RUNING)
              const fullRequestFuture = self.fullRequstFutureCache.pop(response.id)
              if (fullRequestFuture !== null) {
                if (fullRequestFuture.isPending) fullRequestFuture.setResult(response)
              }
            })
            .catch(err => {
            // 请求发送失败
              self.state.changeState(UtState.DISCONECTION)
              console.warn(`重发[${request.requestType}]${request.id}请求失败:${String(err)}`)
            })
        })
        self.reconnectFuture.setResult(true)
      }).catch(err => {
        console.warn(`连接失败，剩余重连：${reconnectNum}/${self.maxReconnectNum}`)
        if (reconnectNum < self.maxReconnectNum) {
          self.state.changeState(UtState.RECONNECTING)
          reconnectNum++
          setTimeout(() => {
            self.onDisconnect(false, reconnectNum)
          }, 1000 * Math.log(reconnectNum) * 2)
        } else {
          self.state.changeState(UtState.RECONNECT_FAILDE)
          self.fullRequstFutureCache.setAllRequest2Faild(`请求发送失败，原因:${self.state.getMsg()}`)
          self.reconnectFuture.setResult(false)
          console.error(`连接失败，结束重连.\n${String(err)}`)
        }
      })
  }

  private onPublish (topic: string, msg: any): void {
    this.topicHandlers.getCallback(topic).forEach((cb) => {
      cb(topic, msg)
    })
  }

  private async reSubscribe (): Promise<boolean> {
    // 重新订阅
    const id = this.genRequestId()
    const topics = this.topicHandlers.getAllTopics()
    if (topics.length === 0) return true
    console.log('重新订阅:', topics)
    try {
      const request: UtRequest = { id, requestType: UtType.SUBSCRIBE, topics }
      const response = await this.socket.send(request)
      if (response.state === 1) {
        const { allTopics, subTopics } = response.result as SubscribeResult
        const diff = topics.filter(item => {
          return !allTopics.includes(item)
        })
        console.log('已重新订阅:', subTopics)
        if (diff.length !== 0) {
          console.error('有未成功的订阅:', diff)
          return false
        }
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  public sendRequest2 (fullRequest: FullRequest): FullRequestFuture {
    const id = fullRequest.id
    const self = this
    const fullreqFutrue = new FullRequestFuture(fullRequest)
    if (self.state.getState() !== UtState.RUNING) {
      fullreqFutrue.setRequest2Faild(`请求发送失败，原因:${self.state.getMsg()}`)
      return fullreqFutrue
    }
    self.fullRequstFutureCache.push(id, fullreqFutrue)
    self.socket.send(fullreqFutrue.getUtRequest(), fullRequest.timeout)
      .then(response => {
        if (response.error === BreakErrorMsg) return
        if (fullreqFutrue.isPending) fullreqFutrue.setResult(response)
        self.fullRequstFutureCache.pop(id)
      })
      .catch(error => {
        if (isErrorInstanceOf(error, RequestParamError)) {
          if (fullreqFutrue.isPending) fullreqFutrue.setResult(error)
        }
      })
    return fullreqFutrue
  }

  public async sendRequest (fullRequest: FullRequest): Promise<UtResponse> {
    const id = fullRequest.id
    const fullreqFutrue = new FullRequestFuture(fullRequest)
    if (this.state.getState() !== UtState.RUNING) {
      return fullreqFutrue.setRequest2Faild(`请求发送失败，原因:${this.state.getMsg()}`)
    }
    this.fullRequstFutureCache.push(id, fullreqFutrue)
    try {
      const response = await this.socket.send(fullreqFutrue.getUtRequest(), fullRequest.timeout)
      if (response.error === BreakErrorMsg) return await fullreqFutrue.getResult()
      if (fullreqFutrue.isPending) fullreqFutrue.setResult(response)
      this.fullRequstFutureCache.pop(id)
      return response
    } catch (error) {
      if (isErrorInstanceOf(error, RequestParamError)) {
        throw error
      }
      return await fullreqFutrue.getResult()
    }
  }

  public async subscribe (topic: string, callback: (topic: string, msg: any) => void, timeout?: number, isReSub: boolean = false): Promise<UtResponse> {
    const id = this.genRequestId()
    const fullRequest: FullRequest = { id, requestType: UtType.SUBSCRIBE, topics: [topic], timeout }
    const response = await this.sendRequest(fullRequest)
    if (response.state === 1 && !isReSub) {
      // 添加订阅
      this.topicHandlers.add([topic, callback])
    }
    return response
  }

  public async unsubscribe (topics: string[], timeout?: number): Promise<UtResponse> {
    const id = this.genRequestId()
    const fullRequest: FullRequest = { id, requestType: UtType.UNSUBSCRIBE, topics, timeout }
    const response = await this.sendRequest(fullRequest)
    if (response.state === 1) {
      // 取消订阅
      const self = this
      topics.forEach((topic) => {
        self.topicHandlers.remove(topic)
      })
    }
    return response
  }

  public exit (): void {
    try {
      this.socket.exit()
    } catch (error) {
      this.onDisconnect(true)
    }
    console.log('安全退出.')
  }
}

export interface UtOptions{
  timeout?: number
  outputResult?: boolean
  defaultResult?: any
  throwTimeoutError?: boolean
}

export interface InitOptions{
  username?: string
  password?: string
  maxReconnectNum?: number
}

export type UtClientInitOptions = UtOptions & InitOptions

export interface MiniRequest {
  methodName: string
  params: any[]
}

export class UtClient<R=UtResponse> extends BaseClient {
  protected tempOpts: UtOptions
  private readonly timeout?: number
  private readonly outputResult: boolean
  private readonly defaultResult: any
  private readonly throwTimeoutError: boolean
  constructor (
    url: string,
    utclientInitOptions: UtClientInitOptions = {}) {
    const { username = 'utranhost', password = 'utranhost', maxReconnectNum = 32, timeout, outputResult = false, defaultResult, throwTimeoutError = false } = utclientInitOptions
    super(url, username, password, maxReconnectNum)
    this.timeout = timeout
    this.outputResult = outputResult
    this.defaultResult = defaultResult
    this.throwTimeoutError = throwTimeoutError
  }

  public setOptions (opts: UtOptions): UtClient {
    this.tempOpts = opts
    return this as UtClient
  }

  public getOptions (isclear: boolean = true): UtOptions {
    let { timeout, outputResult, defaultResult, throwTimeoutError } = this.tempOpts
    timeout = timeout === undefined ? this.timeout : timeout
    outputResult = outputResult === undefined ? this.outputResult : outputResult
    defaultResult = defaultResult === undefined ? this.defaultResult : defaultResult
    throwTimeoutError = throwTimeoutError === undefined ? this.throwTimeoutError : throwTimeoutError
    if (isclear) this.tempOpts = {}
    return { timeout, outputResult, defaultResult }
  }

  public async callByName (methodName: string, ...params): Promise<R | FullRequest> {
    const { timeout, outputResult, defaultResult } = this.getOptions()
    const { args, dicts } = parameterDeconstruction(...params)
    const id = this.genRequestId()
    const fullrequest = { id, requestType: UtType.RPC, methodName, args, dicts, timeout }
    const response = await this.sendRequest(fullrequest)

    if (outputResult === true) {
      return response.result === undefined ? defaultResult : response.result
    } else {
      return response as R
    }
  }

  public async multicall (...miniRequests: MiniRequest[]): Promise<R[]> {
    return await this._multicall(miniRequests)
  }

  private async _multicall (miniRequests: MiniRequest[]): Promise<R[]> {
    const { timeout, outputResult, defaultResult, throwTimeoutError } = this.getOptions()
    const self = this
    const timeoutMsg = `multicall本地等待超时：${timeout as number}s`
    const calls: Array<Promise<UtResponse>> = []
    const callFutures: FullRequestFuture[] = []
    let responses: any[] = []

    let isTimeout: boolean = false
    if (typeof timeout === 'number') setTimeout(() => { isTimeout = true }, timeout * 1000)

    for (let index = 0; index < miniRequests.length; index++) {
      if (isTimeout && throwTimeoutError === true) throw new LoaclWaitTimoutError(timeoutMsg)
      const r = miniRequests[index]
      const { args, dicts } = parameterDeconstruction(...r.params)
      const methodName = r.methodName
      const id = this.genRequestId()
      const fullrequest = { id, requestType: UtType.RPC, methodName, args, dicts, timeout }
      const futrue = self.sendRequest2(fullrequest)
      callFutures.push(futrue)
      calls.push(futrue.getResult())
    }

    for (let index = 0; index < calls.length; index++) {
      if (isTimeout) {
        if (throwTimeoutError === true) throw new LoaclWaitTimoutError(timeoutMsg)
        responses = []
        callFutures.forEach(fullRequestFuture => {
          self.fullRequstFutureCache.pop(fullRequestFuture.getSource().id)
          if (outputResult === true) {
            responses.push(fullRequestFuture.isPending ? defaultResult : fullRequestFuture.result.result)
          } else {
            responses.push(fullRequestFuture.isPending ? fullRequestFuture.setRequest2Faild(timeoutMsg) : fullRequestFuture.result.result)
          }
        })
        break
      }
      const response: UtResponse = await calls[index]
      const result = outputResult !== true ? response : response.result !== undefined ? response.result : defaultResult
      responses.push(result)
    }
    return responses
  }
}
