import { t } from 'elysia'

export namespace DeviceModel {
  export const scanReqBody = t.Object({
    begin: t.String({ format: 'ipv4' }),
    end: t.String({ format: 'ipv4' }),
  })
}
