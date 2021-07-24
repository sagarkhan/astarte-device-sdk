/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Joi from 'joi';

export const validate = (schema: Record<string, any>, payload: Record<string, any>): void => {
  const { error } = Joi.object(schema).validate(payload);
  if (error) {
    throw error;
  }
};

export const validators = {
  PAIRING_INIT: {
    realm: Joi.string().required(),
    pairingUrl: Joi.string().required(),
    pairingToken: Joi.string().required(),
    LOG_LEVEL: Joi.string().valid('debug', 'info'),
  },
  DEVICE_REGISTER: {
    hardwareId: Joi.string().required(),
    initialIntrospection: Joi.object().pattern(
      /./,
      Joi.object({
        major: Joi.number(),
        minor: Joi.number(),
      }),
    ),
  },
  DEVICE_UNREGISTER: {
    hardwareId: Joi.string().required(),
    credentialSecret: Joi.string().required(),
  },
  OBTAIN_CREDENTIALS: {
    hardwareId: Joi.string().required(),
    credentialSecret: Joi.string().required(),
    dir: Joi.string().required(),
  },
  VALIDATE_CREDENTIALS: {
    hardwareId: Joi.string().required(),
    credentialSecret: Joi.string().required(),
    clientCertificate: Joi.string().required(),
    dir: Joi.string().optional(),
  },
  OBTAIN_CONNECTION_INFO: {
    hardwareId: Joi.string().required(),
    credentialSecret: Joi.string().required(),
  },
  DEVICE_INIT: {
    hardwareId: Joi.string().required(),
    realm: Joi.string().required(),
    credentialSecret: Joi.string().required(),
    pairingUrl: Joi.string().required(),
    pairingToken: Joi.string().required(),
    dir: Joi.string().required(),
    LOG_LEVEL: Joi.string().valid('debug', 'info'),
  },
  INTERFACE_DEFINITION: {
    interface_name: Joi.string().required(),
    version_major: Joi.number().required(),
    version_minor: Joi.number().required(),
    type: Joi.string().valid('datastream', 'properties').required(),
    ownership: Joi.string().valid('device', 'server').required(),
    aggregation: Joi.string().valid('individual', 'object').optional(),
    mappings: Joi.optional(),
  },
  validateArgsInterfaceName: (args: Array<any>): boolean => {
    if (!args || !args[0]) {
      throw new Error('Interface name is required');
    }

    if (typeof args[0] !== 'string') {
      throw new Error(`Interface name should be of type string, instead type ${typeof args[0]} was passed`);
    }

    return true;
  },
  commonPublish: (args: Array<any>): boolean => {
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error(`Argument interfaceName missing. Expected string received ${typeof args[0]}`);
    }

    if (!args[1] || typeof args[1] !== 'string') {
      throw new Error(`Argument interfacePath missing. Expected string received ${typeof args[1]}`);
    }

    if (!(args[3] instanceof Date)) {
      throw new Error('Argument date is of invalid type, Expected Javascript Date object');
    }
    return true;
  },
  validateArgsPublishInvidual: (args: Array<any>): boolean => {
    if (!args) {
      throw new Error('Missing function arguments i.e interfaceName, interfacePath, value, timestamp');
    }

    validators.commonPublish(args);

    if (!args[2] || (typeof args[2] !== 'string' && typeof args[2] !== 'number')) {
      const msg = `Argument value missing. Expected string or number received ${typeof args[2]}`;
      throw new Error(msg);
    }

    return true;
  },
  validateArgsPublishAggregate: (args: Array<any>): boolean => {
    if (!args) {
      throw new Error('Missing function arguments i.e interfaceName, interfacePath, record, timestamp');
    }

    validators.commonPublish(args);

    if (!args[2] || typeof args[2] !== 'object' || !Object.keys(args[2]).length) {
      throw new Error('Argument record missing or empty. Expected valid javascript object');
    }

    return true;
  },
};
