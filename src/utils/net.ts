import { IPv4, IPv4CidrRange } from 'ip-num'
import { Socket } from 'node:net'

const specialRanges = [
  IPv4CidrRange.fromCidr('0.0.0.0/32'),
  IPv4CidrRange.fromCidr('255.255.255.255/32'),
  IPv4CidrRange.fromCidr('127.0.0.0/8'),
  IPv4CidrRange.fromCidr('224.0.0.0/4'),
  IPv4CidrRange.fromCidr('240.0.0.0/4'),
]

export const checkInSpecialIpRange = (ipNumber: bigint) => {
  const ip = IPv4.fromNumber(ipNumber)
  return specialRanges.some((range) => range.contains(ip))
}

export const checkTcpPortOpen = async (
  ip: string,
  port: number,
  timeout: number,
) => {
  return new Promise((resolve) => {
    const socket = new Socket()
    socket.setTimeout(timeout)
    socket.allowHalfOpen = false
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, ip)
  })
}
