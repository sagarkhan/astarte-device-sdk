import Device, { Pairing } from '../src/index';

/* Input Variables */
const pairingUrl = 'https://api-demotest-astarte.viewcorp.xyz/pairing/v1';
const pairingToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhX3BhIjpbIi4qOjouKiJdLCJpYXQiOjE2MTQwMTk4OTZ9.osczY6yf-c_70ei9Qji7_jXywshL3lUdtDNiQ5IZS2UasdgK1yxc1O9r7aSFbDTztMExJ6b-nFvmoYx2sC1n9ZR5JKumffLCe-mrL38jUu7KoAC717WLILD0Qz_loBTU5VjPvNCcFKpQZObL4aw36m8WTNKwYIdvMy5_S79fInYVK_s8Lk7gJyZPDAj5nj1vDMTMwOu1gfIMSvCpnxAA6lQS2w1qKSXBGZHP7a-97xiNh7bj_yy9UaTaHG_KZngThWkq6hCEtKnuC9DCzOdM5URmMy1-nRpewgv46Q-VbaIGWvtU0u0POUt20PcpVuDqD6gIYv466KlpcqvNeVWIhw';
const realm = 'view56sl7hklgxru4s';
const hardwareId = 'pACpZ0IFV5WqS9q5PcQLow';
const credentialSecret = 'eocky73VPKnNqgPNxknTqboMWmbGJipcH3U20cSut+8=';
const dir = '/Users/cytrix/projects/sdk-test';

const register = async () => {
  /* Initialize Pairing Helper */
  const pairing = new Pairing({
    pairingToken,
    pairingUrl,
    realm,
  });

  /* Store this credential Secret in DB */
  const credentialSecret = await pairing.register({
    hardwareId,
    /* Optional to pass initialIntrospection
    initialIntrospection: {
      'com.astarte.interface': {
        major: 0,
        minor: 1,
      },
    },
    */
  });

  /* Un-Register Device */
  await pairing.unregister({
    hardwareId,
    credentialSecret,
  });
};

const start = async () => {
  /* Initialize Device SDK */
  const device = new Device({
    pairingUrl,
    pairingToken,
    realm,
    hardwareId,
    credentialSecret,
    dir,
  });

  /* Add Interface Definations in Introspection */
  device.addInterface({
    interface_name: 'com.view.sensors.cct.Status',
    version_major: 0,
    version_minor: 1,
    type: 'datastream',
    ownership: 'device',
    mappings: [
      {
        endpoint: '/status/sensors/%{sensor_name}/cct',
        type: 'double',
        explicit_timestamp: true,
        description: 'The color correlated temperature sensor value in kelvin',
      },
    ],
  });
  device.addInterface({
    interface_name: 'com.view.zones.Status',
    version_major: 1,
    version_minor: 0,
    type: 'datastream',
    ownership: 'device',
    aggregation: 'object',
    mappings: [
      {
        endpoint: '/status/desiredTintLevel',
        type: 'integer',
        explicit_timestamp: true,
        description: "The request's tint level",
      },
      {
        endpoint: '/status/desiredDuration',
        type: 'integer',
        explicit_timestamp: true,
        description: "The request's duration in seconds",
      },
      {
        endpoint: '/status/tintAgent',
        type: 'integer',
        explicit_timestamp: true,
        description: 'The current tint agent. UI = 0, CLOUD = 1, SCHEDULE= 2, INTELLIGENCE = 3, SCENE = 4',
      },
      {
        endpoint: '/status/remainingTime',
        type: 'integer',
        explicit_timestamp: true,
        description: "The remaining time for the current tint agent's tint request in seconds",
      },
      {
        endpoint: '/status/tintLevel',
        type: 'integer',
        explicit_timestamp: true,
        description: 'The current tint level CANCEL = 0, LEVEL_1 = 1, LEVEL_2 = 2, LEVEL_3 = 3, LEVEL_4 = 4',
      },
      {
        endpoint: '/status/tintState',
        type: 'integer',
        explicit_timestamp: true,
        description: 'The current tint state.',
      },
      {
        endpoint: '/status/extraData',
        type: 'string',
        explicit_timestamp: true,
        description: 'Extra data to provide more information, likely in json form.',
      },
    ],
  });

  device.addInterface({
    interface_name: 'com.view.devices.Control',
    version_major: 1,
    version_minor: 0,
    type: 'datastream',
    ownership: 'server',
    aggregation: 'object',
    mappings: [
      {
        endpoint: '/control/jobID',
        type: 'string',
        reliability: 'unique',
        description:
          'Required. The corresponding Job ID to track the progress of the operation. Can be omitted if tracking the operation is not necessary. When set, progress can be tracked through the JobStatuses interface.',
      },
      {
        endpoint: '/control/command',
        type: 'string',
        reliability: 'unique',
        description: 'Required. This will be the command for vff',
      },
      {
        endpoint: '/control/extraData',
        type: 'string',
        reliability: 'unique',
        description: 'Extra data to provide more information, likely in json form.',
      },
    ],
  });

  /* Connect Device to MQTT Broker */
  await device.connect();

  /* Publish Individual Interface data */
  device.sendIndividual('com.view.sensors.cct.Status', '/status/sensors/CCT/cct', 2.22, new Date());

  /* Publish Aggregate Interface Data */
  device.sendAggregate(
    'com.view.zones.Status',
    '/status',
    {
      desiredTintLevel: 2,
      desiredDuration: 3600,
      tintAgent: 0,
      remainingTime: 3500,
      tintLevel: 2,
      tintState: 9,
    },
    new Date(),
  );

  /* Subscribe to Interfaces, Note: ownership of interface should be server */
  device.subscribe('com.view.devices.Control');

  /* Listen to incoming messages of the subscribed interfaces */
  device.on('message', (topic, payload) => {
    console.log(topic);
    console.log(payload);
  });
};

start();
