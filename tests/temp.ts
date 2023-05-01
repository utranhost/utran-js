export interface UtResponse {
  id: number
  responseType: UtType
  state: number
  methodName?: string
  result?: any
  error?: string
}
export enum UtType {
  GET = 'get',
  RPC = 'rpc',
  POST = 'post',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PUBLISH = 'publish',
}


export class UtClient{
  call:any = createCallAgent(this)
  callByName(methodName:string,...args){
    console.log(methodName,args)
  }
  multicall(...args){
    
  }
}


class CallAgent extends Function{

  _methodName:string=''
  _options:object = {}
}



function createCallAgent(client:UtClient):CallAgent{
  const callAgent = new CallAgent()
  const proxy = new Proxy(callAgent,{
    get(target, p) {
      if(typeof p === "string"){
        callAgent._methodName+= callAgent._methodName===''?p:'.'.concat(p)
        return proxy
      }
      return target[p]
    },
    apply(target, thisArg, argArray) { 
      if(target._methodName===''){
        target._options = argArray
        return proxy
      }
      const methodName = target._methodName
      target._methodName = ''
      const res = client.callByName(methodName,...argArray)
      return res
    },
  })
  return proxy
}


const client = new UtClient()

client.call({timeout:10}).add(1,2)
client.call.sub.bb(1,2)
// client.call


