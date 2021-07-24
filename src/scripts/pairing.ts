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

import httpClient from '../utils/http-client';
import logger from '../utils/logger';
import { PAIRING_INIT, OBTAIN_CERTS, OBTAIN_CONNECTION_INFO, REGISTER_CONFIGS, VALIDATE_CERTS } from '../utils/types';
import { generateCSR, getClientCertificate, saveClientCertificate } from '../utils/crypto';
import { validate, validators } from '../utils/validator';

export default class Pairing {
  realm: string;
  pairingUrl: string;
  pairingToken: string;

  constructor(init: PAIRING_INIT) {
    validate(validators.PAIRING_INIT, init);

    this.realm = init.realm;
    this.pairingUrl = init.pairingUrl;
    this.pairingToken = init.pairingToken;

    if (init.LOG_LEVEL) {
      logger.level = init.LOG_LEVEL;
    }
  }

  register = async (config: REGISTER_CONFIGS): Promise<string> => {
    validate(validators.DEVICE_REGISTER, config);
    const payload = {
      data: {
        hw_id: config.hardwareId,
        initial_introspection: config.initialIntrospection,
      },
    };
    logger.debug('Starting Device Registration');
    logger.debug(payload);
    try {
      const response = await httpClient.post(`${this.pairingUrl}/${this.realm}/agent/devices`, payload, {
        headers: { Authorization: `Bearer ${this.pairingToken}` },
      });
      logger.info('Device Registeration Success, Please save the device credentials');
      return response?.data?.credentials_secret;
    } catch (err) {
      logger.error('Device Registration Failed');
      logger.error(err);
      throw err;
    }
  };

  unregister = async (config: OBTAIN_CONNECTION_INFO): Promise<any> => {
    try {
      validate(validators.DEVICE_UNREGISTER, config);
      const headers = { Authorization: `Bearer ${config.credentialSecret}` };
      const response = await httpClient.delete(`${this.pairingUrl}/${this.realm}/agent/devices/${config.hardwareId}`, {
        headers,
      });
      return response;
    } catch (err) {
      logger.error('Device Registration Error');
      logger.error(err);
      throw err;
    }
  };

  obtainCredentials = async (config: OBTAIN_CERTS): Promise<string> => {
    try {
      validate(validators.OBTAIN_CREDENTIALS, config);
      const certificate = getClientCertificate(this.realm, config.hardwareId, config.dir);
      if (certificate) {
        try {
          const request: VALIDATE_CERTS = {
            ...config,
            clientCertificate: certificate,
          };
          await this.validateCredentials(request);
          return certificate;
        } catch (err) {
          logger.error(err);
        }
      }

      const csr = await generateCSR(this.realm, config.hardwareId, config.dir);
      const headers = { Authorization: `Bearer ${config.credentialSecret}` };
      const data = { data: { csr } };

      const response = await httpClient.post(
        `${this.pairingUrl}/${this.realm}/devices/${config.hardwareId}/protocols/astarte_mqtt_v1/credentials`,
        data,
        { headers },
      );
      const clientCertificate = response.data.client_crt;
      saveClientCertificate(this.realm, config.hardwareId, config.dir, clientCertificate);
      return clientCertificate;
    } catch (err) {
      logger.error('Error in obtaining device credentials');
      logger.error(err);
      throw err;
    }
  };

  validateCredentials = async (config: VALIDATE_CERTS): Promise<boolean> => {
    try {
      validate(validators.VALIDATE_CREDENTIALS, config);
      const headers = { Authorization: `Bearer ${config.credentialSecret}` };
      const data = {
        data: {
          client_crt: Buffer.isBuffer(config.clientCertificate)
            ? config.clientCertificate.toString('utf-8')
            : config.clientCertificate,
        },
      };
      const response = await httpClient.post(
        `${this.pairingUrl}/${this.realm}/devices/${config.hardwareId}/protocols/astarte_mqtt_v1/credentials/verify`,
        data,
        { headers },
      );

      const isValid = response?.data?.valid;
      if (!isValid) {
        throw new Error('Certificate Invalid or expired');
      }

      return isValid;
    } catch (err) {
      logger.error('Error in validating client certificate');
      logger.error(err);
      throw err;
    }
  };

  obtainConnectionInfo = async (config: OBTAIN_CONNECTION_INFO): Promise<string> => {
    try {
      validate(validators.OBTAIN_CONNECTION_INFO, config);
      const headers = { Authorization: `Bearer ${config.credentialSecret}` };
      const response = await httpClient.get(`${this.pairingUrl}/${this.realm}/devices/${config.hardwareId}`, {
        headers,
      });
      const { broker_url: mqttBroker = '' } = response?.data?.protocols?.astarte_mqtt_v1;
      return mqttBroker;
    } catch (err) {
      logger.error('Error in obtaining device connection information');
      logger.error(err);
      throw err;
    }
  };
}
