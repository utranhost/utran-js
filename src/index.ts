// import { WebSocket as WebSocket2 } from 'ws'
// import { run, addCloseListener } from './client/base'
// import { CallFuncOptions, CallFuncOptionsDefualt, BaseClient } from './client/baseclient'
// import { SAFE_EIXTCODE } from './object'
import { UtSocket } from './client/socket'

/**
 * Utran version
 * @return {string}
 */
function version (): string {
  return '__BUILD_VERSION__'
}

export { version, UtSocket }
