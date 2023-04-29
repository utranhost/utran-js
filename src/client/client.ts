import { UtType, UtRequest, Futrue, FullRequestFuture, UtResponse, LoaclWaitTimoutError, ClientState, FullRequstFutureCache, UtState } from '../object'
import { basicAuth, isErrorInstanceOf } from '../utils'
import { UtSocket } from './socket'

export class Client {
  private socket: UtSocket
  private readonly url: string
  private requestId: number = 0
  private reconnectFuture: Futrue<boolean, never, never>
  private readonly fullRequstFutureCache: FullRequstFutureCache = new FullRequstFutureCache()
  private readonly maxReconnectNum: number
  private readonly state: ClientState = new ClientState(UtState.UN_START)
  constructor (url: string, usename: string = 'utranhost', password: string = 'utranhost', maxReconnectNum: number = 3) {
    const token = basicAuth(usename, password)
    this.url = `${url}?Authorization=${token}`
    this.socket = new UtSocket(this.url, this.onDisconnect.bind(this))
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

  private genRequestId (): number {
    this.requestId++
    return this.requestId
  }

  private onDisconnect (faildRequest: UtRequest[], reconnectNum: number = 0): void {
    const self = this
    
    faildRequest = self.fullRequstFutureCache.getAllUtRequest()
    self.reconnectFuture = new Futrue<boolean, never, never>()
    console.warn(`尝试重连:${reconnectNum}/${self.maxReconnectNum}`)
    self.state.changeState(UtState.DISCONECTION)
    new UtSocket(this.url, this.onDisconnect.bind(this)).start().then(socket => {
      // 重连成功
      self.socket = socket
      self.state.changeState(UtState.RUNING)
      faildRequest.forEach(request => {
        // 重新发起请求
        socket.send(request)
          .then(response => {
            // 请求发送成功
            self.state.changeState(UtState.RUNING)
            const fullRequestFuture = self.fullRequstFutureCache.pop(response.id)
            if (fullRequestFuture !== null) {
              fullRequestFuture.setResult(response)
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
          self.onDisconnect(faildRequest, reconnectNum)
        }, 1000 * Math.log(reconnectNum) * 2)
      } else {
        self.state.changeState(UtState.RECONNECT_FAILDE)
        self.fullRequstFutureCache.setAllRequest2Faild(`请求发送失败，原因:${self.state.getMsg()}`)
        self.reconnectFuture.setResult(false)
        console.error(`连接失败，结束重连.\n${String(err)}`)
      }
    })
  }

  
  public async call (methodName: string, { args = [], dicts = {}, timeout = undefined }: {args: any[], dicts: object, timeout?: number}): Promise<UtResponse> {
    const id = this.genRequestId()
    const requestType = UtType.RPC
    const fullreqFutrue = new FullRequestFuture({ id, requestType, methodName, args, dicts, timeout })
    if (this.state.getState() !== UtState.RUNING) {
      return fullreqFutrue.setRequest2Faild(`请求发送失败，原因:${this.state.getMsg()}`)
    }
    this.fullRequstFutureCache.push(id, fullreqFutrue)
    try {
      const response = await this.socket.send({ id, requestType, methodName, args, dicts }, timeout)
      fullreqFutrue.setResult(response)
      this.fullRequstFutureCache.pop(id)
      return response
    } catch (error) {
      if (isErrorInstanceOf(error, LoaclWaitTimoutError)) {
        this.fullRequstFutureCache.pop(id)
        return fullreqFutrue.setRequest2Faild(`${this.state.getMsg()}`)
      }
      return await fullreqFutrue.getResult()
    }
  }

  // public async multicall (...calls: Array<Client['call']>): Promise<any> {
  //   if (!this.isruning) await this.holdingReconnect
  //   return await this.bsclient.multicall(calls)
  // }

  // public async subscribe (topic: string, callback: (topic: string, msg: any) => void): Promise<any> {
  //   if (!this.isruning) await this.holdingReconnect
  //   return await this.bsclient.subscribe(topic, callback)
  // }

  // public async unsubscribe (topic: string[]): Promise<any> {
  //   if (!this.isruning) await this.holdingReconnect
  //   return await this.bsclient.unsubscribe(topic)
  // }

  // private reconnection (code: number): void {
  //   if (code === SAFE_EIXTCODE) return
  //   const self = this
  //   const oldClient = this.bsclient
  //   this.holdingReconnect = new Promise((resolve, reject) => {
  //     console.warn('断线重连中..')
  //     this.isruning = false
  //     self.start()
  //       .then(res => {
  //         console.log('重连成功')
  //         const topicHandlers = oldClient.getTopicHandlers()
  //         if (topicHandlers.length > 0) {
  //           // 重新订阅topic
  //           const p = topicHandlers.map(async ([topic, handler]) => {
  //             return await self.bsclient.subscribe(topic, handler)
  //           })
  //           Promise.all(p)
  //             .then((res) => {
  //               console.log(`已重新订阅：${String(topicHandlers.map(([topic, _]) => { return topic }))}`)
  //               resolve(res)
  //             })
  //             .catch((err) => {
  //               console.warn(`重新订阅时失败，${String(err)}`)
  //               reject(err)
  //             })
  //         } else {
  //           // 没有重订的topic
  //           resolve(res)
  //         }
  //       }).catch(err => { reject(err) })
  //   })
  // }
}
