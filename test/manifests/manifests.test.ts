import nock from 'nock'

import {
  handleManifest,
  updateManifestsFromRippled,
  updateUNLManifests,
  updateUnls,
} from '../../src/connection-manager/manifests'
import {
  destroy,
  query,
  setupTables,
  tearDown,
} from '../../src/shared/database'
import networks from '../../src/shared/database/networks'
import config from '../../src/shared/utils/config'

import unl1 from './fixtures/unl-response1.json'
import unl2 from './fixtures/unl-response2.json'

const VALIDATOR_URL = networks[0].unls[0]

describe('manifest ingest', () => {
  beforeAll(async () => {
    await tearDown()
    await setupTables()
  })

  afterAll(async () => {
    await tearDown()
    await destroy()
  })

  beforeEach(async () => {
    await query('manifests').delete('*')
    await query('validators').delete('*')
  })

  afterEach(async () => {
    nock.cleanAll()
    await query('manifests').delete('*')
    await query('validators').delete('*')
  })

  test('handleManifest', async () => {
    const manifest = {
      master_key: 'nHDaeKJcfRzzmx3gGKnrFTQazYi95tdGrdoiCYLinoU9EkJsp4Ho',
      master_signature:
        '7CA31C480E2ED7DBD1C2A0CA950545C73C7EB9838D5A5C5D16D61DFDB47EBC23DAF2BD25B9AA4FE5B8E39D30C575501BC7EE4042E068D935D6D97391B3B46706',
      seq: 1,
      signature:
        '30440220711EC38538E10E01198086D85D4728E81993ADD0746E6D3CEF2E12DC3C3A3A92022046F698FD1B1B3222498049D6006E95EC1422C4E0CB2BFD0D210A4709BAF17A08',
      signing_key: 'n9KhXam7XB436XHhzo3aTzEW5NxkKwVDkuy9DwdDC1ja8j8mv3ot',
    }

    await handleManifest(manifest)

    const saved_manifest = await query('manifests').select('*').where({
      master_signature:
        '7CA31C480E2ED7DBD1C2A0CA950545C73C7EB9838D5A5C5D16D61DFDB47EBC23DAF2BD25B9AA4FE5B8E39D30C575501BC7EE4042E068D935D6D97391B3B46706',
    })
    expect(saved_manifest[0]).toEqual({
      master_key: 'nHDaeKJcfRzzmx3gGKnrFTQazYi95tdGrdoiCYLinoU9EkJsp4Ho',
      master_signature:
        '7CA31C480E2ED7DBD1C2A0CA950545C73C7EB9838D5A5C5D16D61DFDB47EBC23DAF2BD25B9AA4FE5B8E39D30C575501BC7EE4042E068D935D6D97391B3B46706',
      revoked: false,
      seq: '1',
      signature:
        '30440220711EC38538E10E01198086D85D4728E81993ADD0746E6D3CEF2E12DC3C3A3A92022046F698FD1B1B3222498049D6006E95EC1422C4E0CB2BFD0D210A4709BAF17A08',
      signing_key: 'n9KhXam7XB436XHhzo3aTzEW5NxkKwVDkuy9DwdDC1ja8j8mv3ot',
      domain: null,
      domain_verified: false,
    })
  })

  test('update manifests using UNLs', async () => {
    jest.setTimeout(60000)
    await updateUNLManifests()
    const saved_manifest = await query('manifests')
      .select('*')
      .orderBy('master_key')
    expect(saved_manifest[0]).toEqual({
      master_key: 'nHB1bWCNCzBb8Amvcpc7bpgrNDsZRt1wY13nZWmx9FBdsAuQsPJM',
      signing_key: 'n9KQE1euaUTv6a1Jqwsp66ZaQd846F9kYXp5JsGubzz1D64m6P4m',
      master_signature:
        '85D888A4B3942D50E615F186F9EC52D6DA590DA34C0AD8CC8AE287423F7C6570CD02847C7690E70457E311E6AE67E18C78C2D52B526469DD21A2C2F8C190770A',
      signature:
        '3044022004B009914B671B89DD6C0012FFD687C2081732667C5DEE9924776528B90BD688022000996992549379F5D5C186ADAB82C6AD85E1038089E247D875C08E0E205BAFFD',
      revoked: false,
      domain: null,
      domain_verified: false,
      seq: '19',
    })
  })

  test('updateManifestsFromRippled', async () => {
    jest.setTimeout(10000)
    nock(`${config.rippled_rpc_admin_server}`)
      .post('/')
      .reply(200, {
        result: {
          details: {
            domain: '',
            ephemeral_key:
              'n9Ls4GcrofTvLvymKh1wCqxw1aLzXUumyBBD9fAtbkk9WtdQ4TUH',
            master_key: 'nHUpcmNsxAw47yt2ADDoNoQrzLyTJPgnyq16u6Qx2kRPA17oUNHz',
            seq: 8,
          },
          manifest:
            'JAAAAAhxIe1Y9ncNtd135Z0oy2UOw4FuL8lQIbtW5yDJoS2nnFijq3MhAsU/G2z13j7v0bqWr861QB8DL5KBKgfHj0/DLIbIWIEadkYwRAIgCj9uzQIYwk2UzxKJL2v0G/0bflh5PQXbQaGidnKQjBECIGIhAU5/qY1b5DIDwA2ZRonwfCOzRVGKMpe9mscOoAyEcBJAQTp5imRSxnUamaA5esXZh8dMX8aaiA3SObS7C5ORWIoK3HUqIpqU8/wFqTd/iumFvVScYF31+H6pvnNKRHvDDg==',
          requested: 'nHUpcmNsxAw47yt2ADDoNoQrzLyTJPgnyq16u6Qx2kRPA17oUNHz',
          status: 'success',
        },
      })

    await query('validators').insert({
      signing_key: 'n94D6X6oFGyuvWpSjGwv3rmGSPSi5gNEVCDwnEc8arLC6HnqfEhn',
    })

    const manifest = {
      master_key: 'nHUpcmNsxAw47yt2ADDoNoQrzLyTJPgnyq16u6Qx2kRPA17oUNHz',
      master_signature:
        '34CEFB27FE8759DA050810998DF66A34EFA4F2ECA78810531698953974BDD91E5C7C809ED1027B3828C56065A3D22B133045CD639F5C54F1E1BC13AC432E0409',
      seq: 1,
      signature:
        '3045022100E827965B1656F8561DFBD53AC7571AC423AD1669D9BB962127AAE864988B3EC502201C08EF0E9878AF663C0097E74DD49FFD149F9C125C5CA6BFCCF8268791406DE8',
      signing_key: 'n94D6X6oFGyuvWpSjGwv3rmGSPSi5gNEVCDwnEc8arLC6HnqfEhn',
    }
    await handleManifest(manifest)
    await updateManifestsFromRippled()
    const manifests = await query('manifests').select('*')
    expect(manifests[1]).toEqual({
      master_key: 'nHUpcmNsxAw47yt2ADDoNoQrzLyTJPgnyq16u6Qx2kRPA17oUNHz',
      signing_key: 'n9Ls4GcrofTvLvymKh1wCqxw1aLzXUumyBBD9fAtbkk9WtdQ4TUH',
      master_signature:
        '413A798A6452C6751A99A0397AC5D987C74C5FC69A880DD239B4BB0B9391588A0ADC752A229A94F3FC05A9377F8AE985BD549C605DF5F87EA9BE734A447BC30E',
      signature:
        '304402200A3F6ECD0218C24D94CF12892F6BF41BFD1B7E58793D05DB41A1A27672908C1102206221014E7FA98D5BE43203C00D994689F07C23B345518A3297BD9AC70EA00C84',
      revoked: false,
      domain: null,
      domain_verified: false,
      seq: '8',
    })
  })

  test('updates unls', async () => {
    // Mock validator list contains a single validator
    nock(`http://${VALIDATOR_URL}`).get('/').reply(200, unl1)
    await query('validators').insert({
      master_key: 'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      signing_key: 'n9LCf7NtwcyXVc5fYB6UVByRoQZqJDhrMUoKnr3GQB6mFqpcmMzg',
    })
    await query('manifests').insert({
      master_key: 'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      signing_key: 'n9LCf7NtwcyXVc5fYB6UVByRoQZqJDhrMUoKnr3GQB6mFqpcmMzg',
    })
    await updateUnls()
    let validator = await query('validators')
      .select('master_key', 'signing_key', 'unl')
      .where(
        'master_key',
        '=',
        'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      )
    expect(validator[0]).toEqual({
      master_key: 'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      signing_key: 'n9LCf7NtwcyXVc5fYB6UVByRoQZqJDhrMUoKnr3GQB6mFqpcmMzg',
      unl: 'vl.ripple.com',
    })

    // New unl replaces old validator with a new one
    nock(`http://${VALIDATOR_URL}`).get('/').reply(200, unl2)
    await updateUnls()
    validator = await query('validators')
      .select('master_key', 'signing_key', 'unl')
      .where(
        'master_key',
        '=',
        'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      )
    expect(validator[0]).toEqual({
      master_key: 'nHBtDzdRDykxiuv7uSMPTcGexNm879RUUz5GW4h1qgjbtyvWZ1LE',
      signing_key: 'n9LCf7NtwcyXVc5fYB6UVByRoQZqJDhrMUoKnr3GQB6mFqpcmMzg',
      unl: null,
    })
  })
})
