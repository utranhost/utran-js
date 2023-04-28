import { WebSocket as WebSocket2 } from 'ws'
import { LocoalTimeoutError, ResultQue, UtRequest, UtResponse, UtType } from '../object'
import { basicAuth } from '../utils'

/**
 * 处理服务器的响应
 * @param response
 * @param resultQue
 */
function onResponse (response: UtResponse, resultQue: ResultQue, publishCallback: publishCallbackType): void {
  if (response.responseType === UtType.PUBLISH) {
    const { topic, msg } = response.result
    publishCallback(topic, msg)
  }
  if ([UtType.RPC, UtType.SUBSCRIBE, UtType.UNSUBSCRIBE].includes(response.responseType)) {
    // onResponse(response)
    const [_, resolve, timer] = resultQue.pop(response.id)
    if (timer != null) clearTimeout(timer)
    resolve(response)
  }
}

export type publishCallbackType = (topic: string, msg: any) => void

/**
 * 添加消息监听
 * @param socket
 */
export function addMessageListener (socket: WebSocket2 | WebSocket, resultQue: ResultQue, publishCallback: publishCallbackType): void {
  if (typeof window !== 'undefined') {
    const self = socket as WebSocket
    self.addEventListener('message', (event) => {
      // console.log("收到消息：",event)
      try {
        const res = JSON.parse(event.data)
        onResponse(res, resultQue, publishCallback)
      } catch (error) {
        console.warn(event.data)
      }
    })
  } else {
    const self = socket as WebSocket2
    self.addEventListener('message', (event) => {
      // console.log("收到消息：",event)
      try {
        const res = JSON.parse(event.data as string)
        onResponse(res, resultQue, publishCallback)
      } catch (error) {
        console.warn(event.data)
      }
    })
    // self.on('message', (data) => {
    //   // console.log("收到消息：",data)
    //   try {
    //     const res = JSON.parse(data.toString())
    //     onResponse(res, resultQue, publishCallback)
    //   } catch (error) {
    //     console.warn(data.toString())
    //   }
    // })
  }
}

export type send2RequestType = (request: UtRequest, timeout?: number) => Promise<UtResponse>

export function getSend2Request (socket: WebSocket2 | WebSocket, resultQue: ResultQue): send2RequestType {
  let requestId = 0
  return async (request: UtRequest, timeout?: number) => {
    requestId++
    request.id = requestId

    let timer: NodeJS.Timeout | number | null = null
    const req = JSON.stringify(request)
    // console.log(req)
    if (typeof window !== 'undefined') {
      const self = socket as WebSocket

      return await new Promise((resolve, reject) => {
        try {
          self.send(req)
        } catch (error) {
          reject(error)
        }
        if (timeout !== undefined) {
          timer = setTimeout(() => {
            reject(new LocoalTimeoutError(`locoal timeout. waited ${timeout * 1000}s`))
          }, timeout * 1000)
        }
        resultQue.push(request.id as number, request, resolve, timer)
      })
    } else {
      const self = socket as WebSocket2
      return await new Promise((resolve, reject) => {
        try {
          self.send(req)
        } catch (error) {
          reject(error)
        }
        if (timeout != null) {
          timer = setTimeout(() => {
            reject(new LocoalTimeoutError(`locoal timeout. waited ${timeout * 1000}s`))
          }, timeout * 1000)
        }
        resultQue.push(request.id as number, request, resolve, timer)
      })
    }
  }
}

/**
 * 添加错误监听
 * @param socket
 */
export function addErrorListener (socket: WebSocket2 | WebSocket): void {
  if (typeof window !== 'undefined') {
    const self = socket as WebSocket
    self.addEventListener('error', (event) => {
      console.error(event)
    })
  } else {
    const self = socket as WebSocket2
    self.on('error', (data) => {
      console.error(data.toString())
    })
  }
}

/**
 * 添加关闭监听
 * @param socket
 */
export function addCloseListener (socket: WebSocket2 | WebSocket, callback?: (value: number) => void): void {
  if (typeof window !== 'undefined') {
    const self = socket as WebSocket
    self.addEventListener('close', (event) => {
      console.log('关闭：' + event.code.toString())
      if (callback !== undefined) callback(event.code)
    })
  } else {
    const self = socket as WebSocket2
    self.on('close', (data, reason) => {
      console.log('关闭：' + data.toString() + `, ${reason.toString()}`)
      if (callback !== undefined) callback(data)
    })
  }
}



/**
 * 连接服务器
 * @param url
 * @param usename
 * @param password
 * @returns
 */
export async function run (url: string, usename: string, password: string): Promise<WebSocket2 | WebSocket> {
  const token = basicAuth(usename, password)
  return await new Promise((resolve, reject) => {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      url = `${url}?Authorization=${token}`
      const socket = new window.WebSocket(url)

      socket.addEventListener('error', function tempFuncError (err) {
        socket.removeEventListener('error', tempFuncError)
        reject(err)
      })

      socket.addEventListener('message', function tempFuncMsg (event) {
        if (event.data === 'ok') {
          console.log('连接成功.')
          // socket.removeEventListener('message', tempFuncMsg)
          resolve(socket)
        } else {
          reject(new Error('身份验证失败'))
        }
      }, { once: true })
    } else {
      // Node.js 环境
      const socket = new WebSocket2(url, {
        headers: {
          Authorization: token
        }
      })
      // socket.send
      socket.once('error', (err) => {
        reject(err)
      })
      socket.once('message', (data) => {
        if (data.toString() === 'ok') {
          console.log('连接成功.')
          resolve(socket)
        } else {
          reject(new Error('身份验证失败'))
        }
      })
    }
  })
}
