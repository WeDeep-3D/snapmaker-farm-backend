import { IPv4 } from 'ip-num'

import { checkInSpecialIpRange, checkTcpPortOpen } from '@/utils/net'

import { HttpApi } from './snapmaker/api'

export const checkIsMoonrakerDevice = async (ip: string, timeout = 2000) => {
  try {
    if (!(await checkTcpPortOpen(ip, 7125, timeout))) {
      return false
    }
    return !!(await new HttpApi(ip).getMoonrakerInfo()).result.moonraker_version
      ?.length
  } catch (error) {
    return false
  }
}

export const checkIsSnapmakerDevice = async (ip: string, timeout = 2000) => {
  try {
    if (!(await checkTcpPortOpen(ip, 7125, timeout))) {
      return false
    }
    return (
      await new HttpApi(ip).getSystemInfo()
    ).result.system_info.product_info.machine_type.startsWith('Snapmaker')
  } catch (error) {
    return false
  }
}

export const generateIpsToCheck = (
  beginIpNumber: bigint,
  endIpNumber: bigint,
): string[] => {
  const ipsToCheck: string[] = []
  for (let ipNumber = beginIpNumber; ipNumber <= endIpNumber; ipNumber += 1n) {
    if (checkInSpecialIpRange(ipNumber)) {
      continue
    }
    ipsToCheck.push(IPv4.fromNumber(ipNumber).toString())
  }
  return ipsToCheck
}
