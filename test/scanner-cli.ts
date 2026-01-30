import { ScansHelper } from '@/modules/scans/helper'
import { ipRangesToNumberSet } from '@/modules/scans/utils'
import { HttpApi } from '@/api/snapmaker'
import { filterSpecialIps } from '@/utils/net'

const bgColorYellow = '\x1b[43m'
const reset = '\x1b[0m'

const main = async () => {
  const [startIp, endIp] = process.argv.slice(2)
  if (!startIp || !endIp) {
    console.error('Usage: scanner-cli.exe <startIp> <endIp>')
    process.exit(1)
  }

  let ipsToScan: string[]
  try {
    const ipNumberSet = ipRangesToNumberSet([{ begin: startIp, end: endIp }])
    ipsToScan = filterSpecialIps(ipNumberSet)
  } catch (error) {
    console.error('Invalid IP range:', (error as Error).message)
    process.exit(1)
  }

  if (ipsToScan.length === 0) {
    console.log('No IPs to scan after filtering special ranges.')
    return
  }

  const scansHelper = new ScansHelper()
  scansHelper.concurrency = 512
  const taskId = scansHelper.create(structuredClone(ipsToScan))

  const waitForQueueDrain = async () => {
    while (true) {
      const task = scansHelper.retrieve(taskId)
      if (!task) {
        throw new Error('Task disappeared while waiting for completion')
      }
      if (task.queued.length === 0) {
        return task
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  try {
    const task = await waitForQueueDrain()
    const printResults = await Promise.all(
      task.recognized.map(async (ip) => {
        const httpApi = new HttpApi(ip)
        const {
          result: { system_info },
        } = await httpApi.getSystemInfo()
        const networkInterface = Object.entries(system_info.network).find(
          ([_, interfaceInfo]) => {
            return interfaceInfo.ip_addresses.some(
              (address) => address.address === ip,
            )
          },
        )
        if (networkInterface) {
          const [interfaceName, interfaceInfo] = networkInterface
          return {
            bgColor: interfaceName.includes('eth') ? bgColorYellow : '',
            name: system_info.product_info.device_name,
            interface: interfaceName.includes('eth')
              ? '有线'
              : interfaceName.includes('wlan')
                ? '[无线]'
                : interfaceName,
            ip,
            mac: interfaceInfo.mac_address,
            version: system_info.product_info.firmware_version,
            serial: system_info.product_info.serial_number,
          }
        } else {
          return {
            bgColor: bgColorYellow,
            name: system_info.product_info.device_name,
            interface: '未知',
            ip,
            mac: '未知',
            version: system_info.product_info.firmware_version,
            serial: system_info.product_info.serial_number,
          }
        }
      }),
    )
    console.log(
      `${'设备名称'.padEnd(16)}${'连接方式'.padEnd(8)}${'IP地址'.padEnd(20)}${'MAC地址'.padEnd(20)}${'固件版本'.padEnd(8)}${'序列号'.padEnd(20)}`,
    )

    for (const printResult of printResults.sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      console.log(
        `${printResult.bgColor}${printResult.name.padEnd(16)}${printResult.interface.padEnd(8)}${printResult.ip.padEnd(20)}${printResult.mac.padEnd(20)}${printResult.version.padEnd(8)}${printResult.serial.padEnd(20)}${reset}`,
      )
    }
  } catch (error) {
    console.error('扫描时出现错误：', (error as Error).message)
  } finally {
    scansHelper.destroy()
  }
}

void main()
