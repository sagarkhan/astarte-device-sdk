import httpClient from '../utils/http-client';
import logger from '../utils/logger';
import { PAIRING_INIT, OBTAIN_CERTS, OBTAIN_CONNECTION_INFO, REGISTER_CONFIGS } from '../utils/types';
import { generateCSR } from '../utils/crypto';

export default class Pairing {
  realm: string;
  pairingUrl: string;
  pairingToken: string;

  constructor(init: PAIRING_INIT) {
    this.realm = init.realm;
    this.pairingUrl = init.pairingUrl;
    this.pairingToken = init.pairingToken;
  }

  register = async (config: REGISTER_CONFIGS) => {
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

  unregister = async (config: OBTAIN_CONNECTION_INFO) => {
    try {
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

  obtainCredentials = async (config: OBTAIN_CERTS) => {
    try {
      const csr = await generateCSR(this.realm, config.hardwareId, config.dir);
      const headers = { Authorization: `Bearer ${config.credentialSecret}` };
      const data = { data: { csr } };

      const response = await httpClient.post(
        `${this.pairingUrl}/${this.realm}/devices/${config.hardwareId}/protocols/astarte_mqtt_v1/credentials`,
        data,
        { headers },
      );
      return response;
    } catch (err) {
      console.log(err);
      logger.error('Error in obtaining device credentials');
      logger.error(err);
      throw err;
    }
  };

  obtainConnectionInfo = async (config: OBTAIN_CONNECTION_INFO): Promise<string> => {
    try {
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
