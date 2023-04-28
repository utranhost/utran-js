import WebSocket from 'ws'
import { UtRequest, ResultQue, UtResponse, publishCallbackType, UtType, RequestFaildError, RequestFuture, Futrue, ConnectionFaildError, RequestBreakError, LoaclWaitTimoutError } from '../object'
import { toBuffer, BufferToString, isNodePlatform, isErrorInstanceOf } from '../utils'

class TopicHandlerCollection {
  protected readonly handler: publishCallbackType[]
  protected readonly topics: string[]

  public add (...items: Array<[string, publishCallbackType]>): void {
    const self = this
    items.forEach(function (e) {
      self.topics.push(e[0])
      self.handler.push(e[1])
    })
  }

  public get (topic: string): publishCallbackType[] {
    const self = this
    return self.handler.filter((_, index) => topic === self.topics[index])
  }

  public remove (topic: string): void {
    const n = this.topics.length
    for (let i = n - 1; i >= 0; i--) {
      if (this.topics[i] === topic) {
        this.topics.splice(i, 1)
        this.handler.splice(i, 1)
      }
    }
  }
}

export type NoParameterCallbackType = () => void

export class UtSocket {
  private soket: WebSocket
  private readonly resultQue: ResultQue = new ResultQue()
  private readonly allMsgListener: Array<(e: WebSocket.MessageEvent) => void> = []
  private readonly allOpenListener: Array<(e: WebSocket.Event) => void> = []
  private readonly allCloseListener: Array<(e: WebSocket.CloseEvent) => void> = []
  private readonly allErrorListener: Array<(e: WebSocket.ErrorEvent) => void> = []
  private readonly topicHandlers: TopicHandlerCollection = new TopicHandlerCollection()
  private reconnectFuture: Futrue<boolean, never, never> = new Futrue<boolean, never, never>()
  private readonly maxReconnectNum: number
  private reconnectNum: number = 0
  private readonly url: string
  protected isruning: boolean = false
  protected isSafeExit: boolean = false
  protected startFutrue: Futrue<UtSocket, ConnectionFaildError>
  public readonly isNodePlatform: boolean = isNodePlatform()
  public readonly reconnectSuccessCallback: NoParameterCallbackType
  public readonly reconnectFaildCallback: NoParameterCallbackType
  constructor (url: string, maxReconnectNum: number = 32, reconnectSuccessCallback: NoParameterCallbackType = () => {}, reconnectFaildCallback: NoParameterCallbackType = () => {}) {
    this.url = url
    this.reconnectSuccessCallback = reconnectSuccessCallback
    this.reconnectFaildCallback = reconnectFaildCallback
    this.maxReconnectNum = maxReconnectNum
    this.reconnectFuture.setResult(true) // 首次放行
  }

  public getState (): boolean {
    return this.isruning
  }

  /**
   * 启动socket
   * @returns
   */
  public async start (): Promise<UtSocket> {
    const self = this
    if (self.isruning) return await self.startFutrue.holding()

    self.isruning = true
    self.startFutrue = new Futrue<UtSocket, ConnectionFaildError>()
    self.soket = new WebSocket(self.url)

    self.onError((event) => {
      console.error(`连接出错: ${String(event.error)}`)
      self.startFutrue.setError(new ConnectionFaildError(event.error))
    }, true)

    self.onMessage((event) => {
      if (BufferToString(event.data) === 'ok') {
        console.log('连接成功.')
        self.isSafeExit = false
        self.initListener()
        self.startFutrue.setResult(self)
      } else {
        self.startFutrue.setError(new ConnectionFaildError('身份验证失败'))
      }
    }, true)

    self.onClose(() => {
      console.log('连接关闭.')
      self.isruning = false
    }, true)

    return await self.startFutrue.holding()
  }

  /**
   * 发送请求
   * @param request
   * @param timeout
   * @returns
   */
  public async send (request: UtRequest, timeout?: number): Promise<UtResponse> {
    const { id, requestType, methodName } = request
    const faildResponse: UtResponse = { id, responseType: requestType, methodName, state: 0, error: '重连失败' }

    if (!(await this.reconnectFuture.holding())) {
      // 重新连接失败
      return faildResponse
    }

    this.soket.send(toBuffer(request))
    const self = this

    let timer: undefined | NodeJS.Timeout
    const reqFutrue = new RequestFuture(request)
    self.resultQue.push(reqFutrue)
    if (typeof timeout === 'number') {
      timer = setTimeout(() => {
        self.resultQue.pop(request.id)
        reqFutrue.setError(new LoaclWaitTimoutError(`本地等待超时：${timeout}s`, request))
      }, timeout * 1000)
    }

    reqFutrue.finally(() => {
      if (timer !== undefined) clearTimeout(timer)
    })

    try {
      const response = await reqFutrue.getResult()
      return response
    } catch (error) {
      if (isErrorInstanceOf(error, RequestBreakError)) {
        // 重新连接成功才会放出 RequestBreakError 的错误

        
        // const response = await self.send(request, timeout)
        // return response
      } else if (isErrorInstanceOf(error, RequestFaildError)) {
        // 请求失败
        return faildResponse
      } else {
        // 抛出本地等待超时错误  LoaclWaitTimoutError
        throw error
      }
    }
  }

  /**
   * 初始化监听
   */
  private initListener (): void {
    const self = this
    self.onMessage(self.onResponse.bind(self))
    self.onError((event) => {
      console.warn('onError错误:')
      console.warn(event)
    })
    self.onClose((event) => {
      self.onDisconnect(event.reason)
    })
  }

  /**
   * 退出，关闭soket
   */
  public exit (): void {
    this.isSafeExit = true
    this.soket.close()
    console.log('程序退出')
  }

  private onDisconnect (error: string): void {
    const self = this
    self.reconnectFuture = self.reconnectFuture.isPending ? self.reconnectFuture : new Futrue<boolean, never, never>()
    setTimeout(() => {
      console.warn(error)
      self.isruning = false
      if (!self.isSafeExit) {
        console.warn(`尝试重连:${self.reconnectNum}/${self.maxReconnectNum}`)
        if (self.reconnectNum === self.maxReconnectNum) {
          self.reconnectNum = 0
          self.reconnectFuture.setResult(false)
          console.error('重连失败.')
          self.offAllListener() // 清除所有的监听
          self.reconnectFaildCallback()
          self.isSafeExit = true
        } else {
          self.start().then(() => {
            self.reconnectNum = 0
            self.reconnectFuture.setResult(true)
            console.log('重连成功！')
            self.reconnectSuccessCallback()
            self.resultQue.clear().forEach((reqFutrue) => {
              reqFutrue.setError(new RequestBreakError('请求失败，连接非安全退出而中断', reqFutrue.getSource()))
            })
          }).catch((err) => {
            self.reconnectNum++
            console.warn(`连接失败，剩余重连：${self.reconnectNum}/${self.maxReconnectNum}`)
            self.onDisconnect(err)
          })
        }
      }
      if (self.isSafeExit) {
        self.resultQue.clear().forEach((reqFutrue) => {
          reqFutrue.setError(new RequestFaildError('请求失败，Socket已经关闭', reqFutrue.getSource()))
        })
        self.offAllListener() // 清除所有的监听
      }
    }, 1000 * Math.log(self.reconnectNum) * 2)
  }

  /**
   * 清除soket上所有的监听（非once）
   */
  public offAllListener (): void {
    const self = this
    this.allMsgListener.forEach(function (cb) {
      self.soket.removeEventListener('message', cb)
    })
    this.allOpenListener.forEach(function (cb) {
      self.soket.removeEventListener('open', cb)
    })
    this.allCloseListener.forEach(function (cb) {
      self.soket.removeEventListener('close', cb)
    })
    this.allErrorListener.forEach(function (cb) {
      self.soket.removeEventListener('error', cb)
    })
  }

  public onMessage (cb: (event: WebSocket.MessageEvent) => void, once: boolean = false): void {
    if (!once) this.allMsgListener.push(cb)
    this.soket.addEventListener('message', cb, { once })
  }

  public onOpen (cb: (event: WebSocket.Event) => void, once: boolean = false): void {
    if (!once) this.allOpenListener.push(cb)
    this.soket.addEventListener('open', cb, { once })
  }

  public onClose (cb: (event: WebSocket.CloseEvent) => void, once: boolean = false): void {
    if (!once) this.allCloseListener.push(cb)
    this.soket.addEventListener('close', cb, { once })
  }

  public onError (cb: (event: WebSocket.ErrorEvent) => void, once: boolean = false): void {
    if (!once) this.allErrorListener.push(cb)
    this.soket.addEventListener('error', cb, { once })
  }

  private onResponse (event: WebSocket.MessageEvent): void {
    const data = BufferToString(event.data)
    const response: UtResponse = JSON.parse(data)
    if (response.responseType === UtType.PUBLISH) {
      const { topic, msg } = response.result
      this.topicHandlers.get(topic).forEach((cb) => {
        cb(topic, msg)
      })
    }
    if ([UtType.RPC, UtType.SUBSCRIBE, UtType.UNSUBSCRIBE].includes(response.responseType)) {
      const reqFutrue = this.resultQue.pop(response.id)
      if (reqFutrue !== null) {
        reqFutrue.setResult(response)
      }
    }
  }
}
