import axios from 'axios'

import { checkTcpPortOpen } from '@/utils/net'

export const checkIsMoonrakerDevice = async (ip: string, timeout = 2000) => {
  try {
    if (!(await checkTcpPortOpen(ip, 7125, timeout))) {
      return false
    }
    // noinspection HttpUrlsUsage
    const moonrakerApi = axios.create({
      adapter: 'fetch',
      baseURL: `http://${ip}:7125`,
    })
    return !!(await moonrakerApi.get('/server/info')).data?.result
      ?.moonraker_version?.length
  } catch (error) {
    return false
  }
}
