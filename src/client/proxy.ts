import { UtClient, UtOptions } from './client'

class CallAgent extends Function {
  _methodName: string = ''
  _options: UtOptions = {}
}

function createCallAgent (client: Client): CallAgent {
  const callAgent = new CallAgent()
  const proxy = new Proxy(callAgent, {
    get (target, p) {
      if (typeof p === 'string') {
        callAgent._methodName += callAgent._methodName === '' ? p : '.'.concat(p)
        return proxy
      }
      return target[p]
    },
    apply (target, _thisArg, argArray) {
      if (target._methodName === '') {
        target._options = argArray[0]
        return proxy
      }

      client.setOptions(Object.keys(callAgent._options).length !== 0 ? callAgent._options : client._get_opts())
      callAgent._options = {}
      const methodName = target._methodName
      target._methodName = ''
      const res = client.callByName(methodName, ...argArray)
      return res
    }
  })
  return proxy
}

export class Client extends UtClient {
  public call: CallAgent = createCallAgent(this)
  public _get_opts (): UtOptions {
    return this.tempOpts
  }
}
