/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
// eslint-disable-next-line import/no-extraneous-dependencies
import chai from 'chai';
import { validate, validators } from '../utils/validator';

const { expect } = chai;

describe('Validators Error Check', () => {
  it('should throw error "Interface name is required"', () => {
    expect(validators.validateArgsInterfaceName.bind(validators, [])).to.throw();
  });

  it('shoud throw error "Interface name should be of type string"', () => {
    expect(validators.validateArgsInterfaceName.bind(validators, [1])).to.throw();
  });

  it('should throw error "Missing function arguments i.e interfaceName, interfacePath, value, timestamp"', () => {
    expect(validators.validateArgsPublishInvidual.bind(validators, [])).to.throw();
  });

  it('should throw error "Argument interfaceName missing. Expected string received"', () => {
    expect(
      validators.validateArgsPublishInvidual.bind(validators, [undefined, 'path', 'value', new Date()]),
    ).to.throw();
  });

  it('should throw error "Argument value missing. Expected string or number received"', () => {
    expect(validators.validateArgsPublishInvidual.bind(validators, ['interface', 'path', {}, new Date()])).to.throw();
  });

  it('should throw error "Argument date is of invalid type, Expected Javascript Date object"', () => {
    expect(
      validators.validateArgsPublishInvidual.bind(validators, ['interface', 'path', 'value', '2021-01-01']),
    ).to.throw();
  });

  it('should throw error "Argument record missing or empty. Expected valid javascript object"', () => {
    expect(validators.validateArgsPublishAggregate.bind(validators, ['interface', 'path', {}, new Date()])).to.throw();
  });

  it('PAIRING_INIT should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.PAIRING_INIT, {})).to.throw();
  });

  it('DEVICE_INIT should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.DEVICE_INIT, {})).to.throw();
  });

  it('DEVICE_REGISTER should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.DEVICE_REGISTER, {})).to.throw();
  });

  it('DEVICE_UNREGISTER should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.DEVICE_UNREGISTER, {})).to.throw();
  });

  it('OBTAIN_CREDENTIALS should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.OBTAIN_CREDENTIALS, {})).to.throw();
  });

  it('VALIDATE_CREDENTIALS should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.VALIDATE_CREDENTIALS, {})).to.throw();
  });

  it('OBTAIN_CONNECTION_INFO should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.OBTAIN_CONNECTION_INFO, {})).to.throw();
  });

  it('INTERFACE_DEFINITION should throw error "Validation Error"', () => {
    expect(validate.bind(validate, validators.INTERFACE_DEFINITION, {})).to.throw();
  });
});

describe('Validators Success Check', () => {
  it('Checking validateArgsInterfaceName, should return true', () => {
    expect(validators.validateArgsInterfaceName(['interfaceName'])).to.equal(true);
  });

  it('Checking validateArgsPublishInvidual, should return true', () => {
    expect(validators.validateArgsPublishInvidual(['interfaceName', 'path', 'value', new Date()])).to.equal(true);
  });

  it('Checking validateArgsPublishAggregate, should return true', () => {
    expect(validators.validateArgsPublishAggregate(['interfaceName', 'path', { value: 1 }, new Date()])).to.equal(true);
  });

  it('Checking PAIRING_INIT, should return undefined', () => {
    expect(
      validate(validators.PAIRING_INIT, {
        pairingToken: 'pairingToken',
        pairingUrl: 'pairingUrl',
        realm: 'realm',
      }),
    ).to.equal(undefined);
  });

  it('DEVICE_INIT, should return undefined"', () => {
    expect(
      validate(validators.DEVICE_INIT, {
        pairingToken: 'pairingToken',
        pairingUrl: 'pairingUrl',
        realm: 'realm',
        hardwareId: 'hardwareId',
        credentialSecret: 'credentialSecret',
        dir: 'dir',
      }),
    ).to.equal(undefined);
  });

  it('DEVICE_REGISTER, should return undefined"', () => {
    expect(
      validate(validators.DEVICE_REGISTER, {
        hardwareId: 'hardwareId',
        initialIntrospection: {
          interface: {
            major: 1,
            minor: 0,
          },
        },
      }),
    ).to.equal(undefined);
  });

  it('DEVICE_UNREGISTER, should return undefined"', () => {
    expect(
      validate(validators.DEVICE_UNREGISTER, {
        hardwareId: 'hardwareId',
        credentialSecret: 'credentialSecret',
      }),
    ).to.equal(undefined);
  });

  it('OBTAIN_CREDENTIALS, should return undefined"', () => {
    expect(
      validate(validators.OBTAIN_CREDENTIALS, {
        hardwareId: 'hardwareId',
        credentialSecret: 'credentialSecret',
        dir: 'dir',
      }),
    ).to.equal(undefined);
  });

  it('VALIDATE_CREDENTIALS, should return undefined"', () => {
    expect(
      validate(validators.VALIDATE_CREDENTIALS, {
        hardwareId: 'hardwareId',
        credentialSecret: 'credentialSecret',
        clientCertificate: 'clientCertificate',
      }),
    ).to.equal(undefined);
  });

  it('OBTAIN_CONNECTION_INFO, should return undefined"', () => {
    expect(
      validate(validators.OBTAIN_CONNECTION_INFO, {
        hardwareId: 'hardwareId',
        credentialSecret: 'credentialSecret',
      }),
    ).to.equal(undefined);
  });

  it('INTERFACE_DEFINITION, should return undefined"', () => {
    expect(
      validate(validators.INTERFACE_DEFINITION, {
        interface_name: 'interface',
        version_major: 0,
        version_minor: 1,
        type: 'datastream',
        description: 'Some description',
        doc: 'Some doc',
        ownership: 'device',
        aggregation: 'object',
      }),
    ).to.equal(undefined);
  });
});
