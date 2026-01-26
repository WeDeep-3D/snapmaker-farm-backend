import { IPv4, IPv4CidrRange } from 'ip-num'

import { generateSequence } from '@/utils/common'

export const ipRangesToNumberSet = (
  ranges: ({ cidr: string } | { begin: string; end: string })[],
  maxCount = 0n,
): Set<bigint> => {
  const result = new Set<bigint>()
  for (const range of ranges) {
    let ipv4BeginNumber: bigint
    let ipv4EndNumber: bigint
    if ('cidr' in range) {
      const iPv4CidrRange = IPv4CidrRange.fromCidr(range.cidr)
      ipv4BeginNumber = iPv4CidrRange.getFirst().value
      ipv4EndNumber = iPv4CidrRange.getLast().value
    } else {
      ipv4BeginNumber = IPv4.fromString(range.begin).value
      ipv4EndNumber = IPv4.fromString(range.end).value
    }

    const currentCount = ipv4EndNumber - ipv4BeginNumber + 1n
    if (maxCount > 0n && currentCount + BigInt(result.size) >= maxCount) {
      throw new RangeError(`Total IP count too large, max is ${maxCount}`)
    }
    for (const ipNumber of generateSequence(
      ipv4BeginNumber,
      ipv4EndNumber + 1n,
    )) {
      result.add(ipNumber)
    }
  }
  return result
}
