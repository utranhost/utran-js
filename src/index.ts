import { UtSocket } from './client/socket'
import { BaseClient, UtClient } from './client/client'
import { Client } from './client/proxy'
/**
 * Utran version
 * @return {string}
 */
function version (): string {
  return '__BUILD_VERSION__'
}

export { version, UtSocket, BaseClient, UtClient, Client }
