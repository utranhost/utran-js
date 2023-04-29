import { UtType, UtRequest, Futrue, FullRequestFuture, UtResponse, LoaclWaitTimoutError, UtCache, FullRequstFutureCache } from '../object'
import { basicAuth, isErrorInstanceOf } from '../utils'
import { UtSocket } from './socket'

export class Client {
  private socket: UtSocket
  private readonly url: string
  private requestId: number = 0
  private reconnectFuture: Futrue<boolean, never, never>
  private readonly fullRequstFutureCache: FullRequstFutureCache = new FullRequstFutureCache()
  private readonly maxReconnectNum: number
  private isconnected: boolean = false
  constructor (url: string, usename: string = 'utranhost', password: string = 'utranhost', maxReconnectNum: number = 3) {
    const token = basicAuth(usename, password)
    this.url = `${url}?Authorization=${token}`
    this.socket = new UtSocket(this.url, this.onDisconnect.bind(this))
    this.maxReconnectNum = maxReconnectNum
  }

  public async start (): Promise<Client> {
    await this.socket.start()
    this.isconnected = true
    return this
  }

  private genRequestId (): number {
    this.requestId++
    return this.requestId
  }

  private onDisconnect (faildRequest: UtRequest[], reconnectNum: number = 0): void {
    const self = this
    self.reconnectFuture = new Futrue<boolean, never, never>()
    console.warn(`尝试重连:${reconnectNum}/${self.maxReconnectNum}`)
    new UtSocket(this.url, this.onDisconnect.bind(this)).start().then(socket => {
      // 重连成功
      self.socket = socket
      self.isconnected = true
      faildRequest.forEach(request => {
        // 重新发起请求
        socket.send(request).then(response => {
          const fullRequestFuture = self.fullRequstFutureCache.pop(response.id)
          faildRequest.pop()
          if (fullRequestFuture !== null) {
            fullRequestFuture.setResult(response)
          }
        }).catch(err => {
          console.warn(`连接断开.\n${String(err)}`)
        })
      })
      self.reconnectFuture.setResult(true)
    }).catch(err => {
      self.isconnected = false
      console.warn(`连接失败，剩余重连：${reconnectNum}/${self.maxReconnectNum}`)
      if (reconnectNum < self.maxReconnectNum) {
        reconnectNum++
        setTimeout(() => {
          self.onDisconnect(faildRequest, reconnectNum)
        }, 1000 * Math.log(reconnectNum) * 2)
      } else {
        self.fullRequstFutureCache.setAllRequest2Faild('请求发送失败，连接已断开.')
        self.reconnectFuture.setResult(false)
        console.error(`连接失败，结束重连.\n${String(err)}`)
      }
    })
  }

  // private onDisconnect (error: string): void {
  //     const self = this
  //     self.reconnectFuture = self.reconnectFuture.isPending ? self.reconnectFuture : new Futrue<boolean, never, never>()
  //     setTimeout(() => {
  //       console.warn(error)
  //       self.isruning = false
  //       if (!self.isSafeExit) {
  //         console.warn(`尝试重连:${self.reconnectNum}/${self.maxReconnectNum}`)
  //         if (self.reconnectNum === self.maxReconnectNum) {
  //           self.reconnectNum = 0
  //           self.reconnectFuture.setResult(false)
  //           console.error('重连失败.')
  //           self.offAllListener() // 清除所有的监听
  //           self.reconnectFaildCallback()
  //           self.isSafeExit = true
  //         } else {
  //           self.start().then(() => {
  //             self.reconnectNum = 0
  //             self.reconnectFuture.setResult(true)
  //             console.log('重连成功！')
  //             self.reconnectSuccessCallback()
  //             self.FullRequstFutureCache.clear().forEach((fullreqFutrue) => {
  //               fullreqFutrue.setError(new RequestBreakError('请求失败，连接非安全退出而中断', fullreqFutrue.getSource()))
  //             })
  //           }).catch((err) => {
  //             self.reconnectNum++
  //             console.warn(`连接失败，剩余重连：${self.reconnectNum}/${self.maxReconnectNum}`)
  //             self.onDisconnect(err)
  //           })
  //         }
  //       }
  //       if (self.isSafeExit) {
  //         self.FullRequstFutureCache.clear().forEach((fullreqFutrue) => {
  //           fullreqFutrue.setError(new RequestFaildError('请求失败，Socket已经关闭', fullreqFutrue.getSource()))
  //         })
  //         self.offAllListener() // 清除所有的监听
  //       }
  //     }, 1000 * Math.log(self.reconnectNum) * 2)
  //   }

  public async call (methodName: string, { args = [], dicts = {}, timeout = undefined }: {args: any[], dicts: object, timeout?: number}): Promise<UtResponse> {
    const id = this.genRequestId()
    const requestType = UtType.RPC
    const fullreqFutrue = new FullRequestFuture({ id, requestType, methodName, args, dicts, timeout })
    if (!this.isconnected) {
      return fullreqFutrue.setRequest2Faild('请求发送失败,未连接.')
    }
    this.fullRequstFutureCache.push(id, fullreqFutrue)
    try {
      const response = await this.socket.send({ id, requestType, methodName, args, dicts }, timeout)
      fullreqFutrue.setResult(response)
      this.fullRequstFutureCache.pop(id)
      return response
    } catch (error) {
      if (isErrorInstanceOf(error, LoaclWaitTimoutError)) {
        throw error
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
