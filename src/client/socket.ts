import WebSocket from 'ws'
import { UtRequest, UtResponse, publishCallbackType, UtType, RequestFuture, Futrue, ConnectionFaildError, UtCache } from '../object'
import { toBuffer, BufferToString, isNodePlatform, checkRequstIsError } from '../utils'

class RequestFutureCache extends UtCache<RequestFuture> {
  constructor () {
    super('RequestFutureCache')
  }
}

type disconnectCallbackType = (isSafeExit: boolean) => void
export const BreakErrorMsg = '请求失败，连接非安全退出而中断'
export class UtSocket {
  private soket: WebSocket
  private readonly requestFutureCahe: RequestFutureCache = new RequestFutureCache()
  private readonly allMsgListener: Array<(e: WebSocket.MessageEvent) => void> = []
  private readonly allOpenListener: Array<(e: WebSocket.Event) => void> = []
  private readonly allCloseListener: Array<(e: WebSocket.CloseEvent) => void> = []
  private readonly allErrorListener: Array<(e: WebSocket.ErrorEvent) => void> = []
  private readonly url: string
  private readonly disconnectCallback: disconnectCallbackType
  private readonly publishCallback: publishCallbackType
  protected isruning: boolean = false
  protected isSafeExit: boolean = false
  protected startFutrue: Futrue<UtSocket, ConnectionFaildError>
  public readonly isNodePlatform: boolean = isNodePlatform()
  constructor (url: string, disconnectCallback: disconnectCallbackType = () => {}, publishCallback: publishCallbackType = () => {}) {
    this.url = url
    this.disconnectCallback = disconnectCallback
    this.publishCallback = publishCallback
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
    const paramError = checkRequstIsError(request)
    if (paramError !== null) {
      reqFutrue.setError(paramError)
      return await reqFutrue.getResult()
    }
    this.soket.send(toBuffer(request))

    if (typeof timeout === 'number') {
      const self = this
      const timer = setTimeout(() => {
        self.requestFutureCahe.pop(request.id)
        reqFutrue.setRequest2Faild(`本地等待超时：${timeout}s`)
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
          // reqFutrue.setError(new RequestFaildError('请求失败，Socket已经关闭', reqFutrue.getSource()))
          reqFutrue.setRequest2Faild('请求失败，Socket已执行退出关闭')
        })
      } else {
        requestFutures.forEach((reqFutrue) => {
          // reqFutrue.setError(new RequestBreakError('请求失败，连接非安全退出而中断', reqFutrue.getSource()))
          reqFutrue.setRequest2Faild(BreakErrorMsg)
        })
      }
      self.isruning = false
      self.offAllListener() // 清除所有的监听
      self.disconnectCallback(self.isSafeExit)
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
      this.publishCallback(topic, msg)
    }
    if ([UtType.RPC, UtType.SUBSCRIBE, UtType.UNSUBSCRIBE].includes(response.responseType)) {
      const reqFutrue = this.requestFutureCahe.pop(response.id)
      if (reqFutrue !== null) {
        reqFutrue.setResult(response)
      }
    }
  }
}
