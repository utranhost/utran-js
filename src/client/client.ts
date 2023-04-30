import { UtType, UtRequest, Futrue, FullRequestFuture, UtResponse, LoaclWaitTimoutError, ClientState, FullRequstFutureCache, UtState, FullRequest, TopicHandlerCollection, SubscribeResult, RequestParamError } from '../object'
import { basicAuth, isErrorInstanceOf } from '../utils'
import { UtSocket } from './socket'

export class BaseClient {
  private socket: UtSocket
  private readonly url: string
  private requestId: number = 0
  private reconnectFuture: Futrue<boolean, never, never>
  private readonly fullRequstFutureCache: FullRequstFutureCache = new FullRequstFutureCache()
  private readonly maxReconnectNum: number
  private readonly state: ClientState = new ClientState(UtState.UN_START)
  private readonly topicHandlers: TopicHandlerCollection = new TopicHandlerCollection()

  constructor (url: string, usename: string = 'utranhost', password: string = 'utranhost', maxReconnectNum: number = 32) {
    const token = basicAuth(usename, password)
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
    new UtSocket(this.url, this.onDisconnect.bind(this), this.onPublish.bind(this)).start().then(socket => {
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

  public async sendRequest (fullRequest: FullRequest): Promise<UtResponse> {
    const id = fullRequest.id
    const fullreqFutrue = new FullRequestFuture(fullRequest)
    if (this.state.getState() !== UtState.RUNING) {
      return fullreqFutrue.setRequest2Faild(`请求发送失败，原因:${this.state.getMsg()}`)
    }
    this.fullRequstFutureCache.push(id, fullreqFutrue)
    try {
      const response = await this.socket.send(fullreqFutrue.getUtRequest(), fullRequest.timeout)
      fullreqFutrue.setResult(response)
      this.fullRequstFutureCache.pop(id)
      return response
    } catch (error) {
      if (isErrorInstanceOf(error, LoaclWaitTimoutError)) {
        this.fullRequstFutureCache.pop(id)
        return fullreqFutrue.setRequest2Faild(`${this.state.getMsg()}`)
      }
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


// class ClienProxy {
//   start:(...args)=> Promise<boolean>
//   call:(...args)=> Promise<UtResponse>
//   multicall:(...args)=> Promise<UtResponse[]>
//   subscribe:(...args)=> Promise<UtResponse>
//   unsubscribe:(...args)=>Promise<UtResponse>
//   exit:()=>void
// }

// function Client(){
//   new BaseClient()
//   // new Proxy(BaseClient,{
//   //   get(target, p, receiver) {

//   //   },
//   // })

// }
