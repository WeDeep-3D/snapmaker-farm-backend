export enum KlippyState {
  disconnected = 'disconnected',
  error = 'error',
  ready = 'ready',
  shutdown = 'shutdown',
  startup = 'startup',
  unknown = 'unknown',
}

export interface GetMoonrakerInfoResp {
  result: {
    klippy_connected: boolean
    klippy_state: KlippyState
    components: string[]
    failed_components: string[]
    registered_directories: string[]
    warnings: string[]
    websocket_count: number
    moonraker_version: string
    missing_klippy_requirements: string[]
    api_version: [number, number, number]
    api_version_string: string
  }
}

export interface GetSystemInfoResp {
  result: {
    system_info: {
      python: {
        version: [
          number,
          number,
          number,
          'alpha' | 'beta' | 'candidate' | 'final',
          number,
        ]
        version_string: string
      }
      product_info: {
        machine_type: string
        nozzle_diameter: number[]
        serial_number: string
        device_name: string
        firmware_version: string
        software_version: string
      }
      cpu_info: {
        cpu_count: number
        bits: string
        processor: string
        cpu_desc: string
        serial_number: string
        hardware_desc: string
        model: string
        total_memory: number | null
        memory_units: string
      }
      sd_info: {
        manufacturer_id: string
        manufacturer: string
        oem_id: string
        product_name: string
        product_revision: string
        serial_number: string
        manufacturer_date: string
        capacity: string
        total_bytes: number
      }
      distribution: {
        name: string
        id: string
        version: string
        version_parts: {
          major: string
          minor: string
          build_number: string
        }
        like: string
        codename: string
        release_info: Record<string, string>
        kernel_version: string
      }
      virtualization: {
        virt_type: string
        virt_identifier: string
      }
      network: Record<
        string,
        {
          mac_address: string
          ip_addresses: {
            family: 'ipv4' | 'ipv6'
            address: string
            is_link_local: boolean
          }[]
        }
      >
      canbus: Record<
        string,
        {
          tx_queue_len: number
          bitrate: number
          driver: string
        }
      >
      provider: 'none' | 'systemd_cli' | 'systemd_dbus' | 'supervisord_cli'
      available_services: string[]
      service_state: Record<
        string,
        {
          active_state: string
          sub_state: string
        }
      >
      instance_ids: {
        moonraker: string
        klipper: string
      }
    }
  }
}

export interface ListRegisteredRootsResp {
  result: {
    name: string
    path: string
    permissions: string
  }[]
}
