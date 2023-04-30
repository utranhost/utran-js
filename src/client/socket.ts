import WebSocket from 'ws'
import { UtRequest, UtResponse, publishCallbackType, UtType, RequestFaildError, RequestFuture, Futrue, ConnectionFaildError, RequestBreakError, LoaclWaitTimoutError, UtCache } from '../object'
import { toBuffer, BufferToString, isNodePlatform } from '../utils'

class RequestFutureCache extends UtCache<RequestFuture> {
  constructor () {
    super('RequestFutureCache')
  }
}

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

  public getCallback (topic: string): publishCallbackType[] {
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

export type disconnectCallbackType = (requests: UtRequest[]) => void

export class UtSocket {
  private soket: WebSocket
  private readonly requestFutureCahe: RequestFutureCache = new RequestFutureCache()
  private readonly allMsgListener: Array<(e: WebSocket.MessageEvent) => void> = []
  private readonly allOpenListener: Array<(e: WebSocket.Event) => void> = []
  private readonly allCloseListener: Array<(e: WebSocket.CloseEvent) => void> = []
  private readonly allErrorListener: Array<(e: WebSocket.ErrorEvent) => void> = []
  private readonly topicHandlers: TopicHandlerCollection = new TopicHandlerCollection()
  private readonly url: string
  protected isruning: boolean = false
  protected isSafeExit: boolean = false
  protected startFutrue: Futrue<UtSocket, ConnectionFaildError>
  public readonly isNodePlatform: boolean = isNodePlatform()
  public readonly disconnectCallback: disconnectCallbackType
  constructor (url: string, disconnectCallback: disconnectCallbackType = () => {}) {
    this.url = url
    this.disconnectCallback = disconnectCallback
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
    const reqFutrue = new RequestFuture(request)
    this.requestFutureCahe.push(request.id, reqFutrue)
    this.soket.send(toBuffer(request))

    if (typeof timeout === 'number') {
      const self = this
      const timer = setTimeout(() => {
        self.requestFutureCahe.pop(request.id)
        reqFutrue.setError(new LoaclWaitTimoutError(`本地等待超时：${timeout}s`, request))
      }, timeout * 1000)

      reqFutrue.finally(() => {
        if (timer !== undefined) clearTimeout(timer)
      })
    }

    return await reqFutrue.getResult()
  }

  /**
   * 初始化监听
   */
  private initListener (): void {
    const self = this
    self.offAllListener() // 清除所有的监听
    self.onMessage(self.onResponse.bind(self))
    self.onError((event) => {
      console.warn(`onError错误:${String(event.error)}`)
    })
    self.onClose(() => {
      const requestFutures = self.requestFutureCahe.clear()
      if (self.isSafeExit) {
        self.requestFutureCahe.clear().forEach((reqFutrue) => {
          reqFutrue.setError(new RequestFaildError('请求失败，Socket已经关闭', reqFutrue.getSource()))
        })
      } else {
        requestFutures.forEach((reqFutrue) => {
          reqFutrue.setError(new RequestBreakError('请求失败，连接非安全退出而中断', reqFutrue.getSource()))
        })
      }
      self.isruning = false
      self.offAllListener() // 清除所有的监听
      self.disconnectCallback(requestFutures.map(requestFuture => { return requestFuture.getSource() }))
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

  /**
   * 清除soket上所有的监听
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
    this.allMsgListener.push(cb)
    this.soket.addEventListener('message', cb, { once })
  }

  public onOpen (cb: (event: WebSocket.Event) => void, once: boolean = false): void {
    this.allOpenListener.push(cb)
    this.soket.addEventListener('open', cb, { once })
  }

  public onClose (cb: (event: WebSocket.CloseEvent) => void, once: boolean = false): void {
    this.allCloseListener.push(cb)
    this.soket.addEventListener('close', cb, { once })
  }

  public onError (cb: (event: WebSocket.ErrorEvent) => void, once: boolean = false): void {
    this.allErrorListener.push(cb)
    this.soket.addEventListener('error', cb, { once })
  }

  private onResponse (event: WebSocket.MessageEvent): void {
    const data = BufferToString(event.data)
    const response: UtResponse = JSON.parse(data)
    if (response.responseType === UtType.PUBLISH) {
      const { topic, msg } = response.result
      this.topicHandlers.getCallback(topic).forEach((cb) => {
        cb(topic, msg)
      })
    }
    if ([UtType.RPC, UtType.SUBSCRIBE, UtType.UNSUBSCRIBE].includes(response.responseType)) {
      const reqFutrue = this.requestFutureCahe.pop(response.id)
      if (reqFutrue !== null) {
        reqFutrue.setResult(response)
      }
    }
  }
}
