// import { UtType,UtRequest, RequestFaildError, Futrue } from "../object"
// import { basicAuth } from "../utils"
// import { UtSocket } from "./socket"

// export class Client {
//     private socket: UtSocket
//     private reconnectFuture = new Futrue<any,any>()
//     private readonly url: string
//     private requestId:number = 0

//     constructor (url: string, usename: string = 'utranhost', password: string = 'utranhost') {
//       const token = basicAuth(usename, password)
//       this.url = `${url}?Authorization=${token}`
//       this.socket = new UtSocket(this.url,this.reconnection.bind(this))
//     }

//     public async start (): Promise<Client>{
//         await this.socket.start()
//         return this
//     }

//     private genRequestId(){
//         this.requestId++
//         return this.requestId
//     }

//     public async call (methodName: string, { args = [], dicts = {}, timeout = undefined, ignore = undefined, multicall = false }): Promise<any> {
//       try {
//         const response = await this.socket.send({id:this.genRequestId(),requestType:UtType.RPC,methodName,args,dicts,},timeout)
//         return response
//       } catch (error) {
//         if (error instanceof RequestFaildError){
//             try {
//                 // 重连成功
//                 await this.reconnectFuture.holding()
//             } catch (error) {
//                 // 重连失败
//             }
//         }else{
//             throw error
//         }
//       }
//     }

//     public async multicall (...calls: Array<Client['call']>): Promise<any> {
//       if (!this.isruning) await this.holdingReconnect
//       return await this.bsclient.multicall(calls)
//     }

//     public async subscribe (topic: string, callback: (topic: string, msg: any) => void): Promise<any> {
//       if (!this.isruning) await this.holdingReconnect
//       return await this.bsclient.subscribe(topic, callback)
//     }

//     public async unsubscribe (topic: string[]): Promise<any> {
//       if (!this.isruning) await this.holdingReconnect
//       return await this.bsclient.unsubscribe(topic)
//     }

//     private reconnection (code: number): void {
//       if (code === SAFE_EIXTCODE) return
//       const self = this
//       const oldClient = this.bsclient
//       this.holdingReconnect = new Promise((resolve, reject) => {
//         console.warn('断线重连中..')
//         this.isruning = false
//         self.start()
//           .then(res => {
//             console.log('重连成功')
//             const topicHandlers = oldClient.getTopicHandlers()
//             if (topicHandlers.length > 0) {
//               // 重新订阅topic
//               const p = topicHandlers.map(async ([topic, handler]) => {
//                 return await self.bsclient.subscribe(topic, handler)
//               })
//               Promise.all(p)
//                 .then((res) => {
//                   console.log(`已重新订阅：${String(topicHandlers.map(([topic, _]) => { return topic }))}`)
//                   resolve(res)
//                 })
//                 .catch((err) => {
//                   console.warn(`重新订阅时失败，${String(err)}`)
//                   reject(err)
//                 })
//             } else {
//               // 没有重订的topic
//               resolve(res)
//             }
//           }).catch(err => { reject(err) })
//       })
//     }
//   }
