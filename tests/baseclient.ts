import { WebSocket as WebSocket2 } from 'ws'
import { ResultQue, SAFE_EIXTCODE, UtRequest, UtResponse, UtType } from '../object'
import { addMessageListener, addCloseListener, addErrorListener, getSend2Request, send2RequestType, publishCallbackType } from './base'

export interface CallFuncOptions {
  args: any[]
  dicts: object
  timeout?: number
  ignore?: boolean
  multicall: boolean
}

export const CallFuncOptionsDefualt: CallFuncOptions = {
  args: [],
  dicts: {},
  timeout: undefined,
  ignore: undefined,
  multicall: false
}

export interface UnsubscribeResult{
  allTopics: string[]
  unSubTopics: string[]
}

export interface SubscribeResult{
  allTopics: string[]
  subTopics: string[]
}

export class BaseClient {
  private readonly send2Request: send2RequestType
  private readonly ignore: boolean
  private topic_handlers: object
  private readonly socket: WebSocket2 | WebSocket
  constructor (socket: WebSocket2 | WebSocket, ignore: boolean = true) {
    const resultQue = new ResultQue()
    this.send2Request = getSend2Request(socket, resultQue)
    addErrorListener(socket)
    addMessageListener(socket, resultQue, this.onPublish.bind(this))
    this.ignore = ignore
    this.topic_handlers = {}
    this.socket = socket
  }

  public async call (methodName: string, { args = [], dicts = {}, timeout = undefined, ignore = undefined, multicall = false }: CallFuncOptions = CallFuncOptionsDefualt): Promise<any> {
    console.log(multicall)
    const request: UtRequest = { requestType: UtType.RPC, methodName, args, dicts }

    const response: UtResponse = await this.send2Request(request, timeout)
    ignore = ignore === undefined ? this.ignore : ignore
    if (Boolean(response.state) || ignore) {
      return response.result
    } else {
      throw Error(`Response '${response.responseType}' Error，${String(response.error)}`)
    }
  }

  public getTopicHandlers (): Array<[string, publishCallbackType]> {
    const res: Array<[string, publishCallbackType]> = []
    const self = this
    Object.keys(self.topic_handlers).forEach((topic: string) => {
      res.push([topic, self.topic_handlers[topic]])
    })
    return res
  }

  private async onPublish (topic: string, msg: any): Promise<void> {
    const callback: publishCallbackType = this.topic_handlers[topic]

    return await new Promise((resolve) => { resolve(callback(topic, msg)) })
  }

  public async multicall (calls: Array<BaseClient['call']>, retransmitFull: boolean = false): Promise<any[]> {
    console.log(retransmitFull)
    const res = await Promise.all(calls)

    return res
  }

  public async subscribe (topic: string, callback: publishCallbackType): Promise<SubscribeResult> {
    const request: UtRequest = { requestType: UtType.SUBSCRIBE, topics: [topic] }
    const response: UtResponse = await this.send2Request(request)
    this.topic_handlers[topic] = callback
    return response.result
  }

  public async unsubscribe (topic: string[]): Promise<UnsubscribeResult> {
    const request: UtRequest = { requestType: UtType.UNSUBSCRIBE, topics: topic }
    const response: UtResponse = await this.send2Request(request)

    for (let i = 0; i < topic.length; i++) {
      const t = topic[i]
      delete this.topic_handlers[t]
    }
    return response.result
  }

  public async exit (): Promise<number> {
    this.socket.close(SAFE_EIXTCODE)
    return await new Promise((resolve, reject) => {
      try {
        addCloseListener(this.socket, resolve)
      } catch (error) {
        reject(error)
      }
    })
  }
}
