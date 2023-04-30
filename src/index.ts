import { UtSocket } from './client/socket'
import { BaseClient } from './client/client'
/**
 * Utran version
 * @return {string}
 */
function version (): string {
  return '__BUILD_VERSION__'
}

export { version, UtSocket, BaseClient }
