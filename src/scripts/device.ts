import mqtt, { AsyncMqttClient, ISubscriptionGrant } from 'async-mqtt';
import { deserialize, serialize } from 'bson';
import fs from 'fs';
import Pairing from './pairing';
import logger from '../utils/logger';
import { DEVICE_INIT, INTERFACE_DEFINATION } from '../utils/types';
import {
  OnCloseCallback,
  OnConnectCallback,
  OnDisconnectCallback,
  OnErrorCallback,
  OnMessageCallback,
  OnPacketCallback,
} from 'mqtt';

export default class Device extends Pairing {
  private mqttClient: AsyncMqttClient;
  initialized: boolean = false;
  hardwareId: string;
  realm: string;
  credentialSecret: string;
  pairingUrl: string;
  pairingToken: string;
  dir: string;
  interfaces: Array<INTERFACE_DEFINATION> = [];

  constructor(init: DEVICE_INIT) {
    super({
      pairingUrl: init.pairingUrl,
      pairingToken: init.pairingToken,
      realm: init.realm,
    });
    this.hardwareId = init.hardwareId;
    this.realm = init.realm;
    this.credentialSecret = init.credentialSecret;
    this.pairingUrl = init.pairingUrl;
    this.pairingToken = init.pairingToken;
    this.dir = init.dir;
  }

  addInterface(defination: INTERFACE_DEFINATION) {
    this.interfaces.push(defination);
  }

  removeInterface(interfaceName: string) {
    this.interfaces = this.interfaces.filter(item => item['interface_name'] !== interfaceName);
  }

  connect = async () => {
    try {
      if (this.isConnected()) {
        return;
      }

      const creds = await this.obtainCredentials({
        credentialSecret: this.credentialSecret,
        hardwareId: this.hardwareId,
        dir: this.dir,
      });

      const mqttUrl = await this.obtainConnectionInfo({
        credentialSecret: this.credentialSecret,
        hardwareId: this.hardwareId,
      });

      const privateKey = fs.readFileSync(`${this.dir}/${this.realm}__${this.hardwareId}.key`);

      this.mqttClient = await mqtt.connectAsync(mqttUrl, {
        rejectUnauthorized: false,
        cert: creds?.data?.client_crt,
        key: privateKey,
      });

      if (this.mqttClient.connected) {
        logger.info('Connected to MQTT Broker');
        this.initialized = true;

        if (this.interfaces.length) {
          const introspection = this.interfaces
            .map(item => {
              return `${item.interface_name}:${item.version_major}:${item.version_minor}`;
            })
            .join(';');

          logger.debug('Publishing Introspection');
          logger.debug(introspection);

          this.mqttClient.publish(`${this.realm}/${this.hardwareId}`, introspection, { qos: 2 });
        }

        logger.debug('Publishing Empty Cache Control');
        this.mqttClient.publish(`${this.realm}/${this.hardwareId}/control/emptyCache`, '1', { qos: 2 });
      } else {
        logger.error('Cannot connect to MQTT Broker');
      }
    } catch (err) {
      logger.error('Failed to establish device connection with the broker');
      logger.error(err);
      throw err;
    }
  };

  disconnect = (force: boolean = false): Promise<void> => {
    logger.info('Disconnecting MQTT Client');
    if (!this.isConnected()) {
      return Promise.resolve();
    }
    return this.mqttClient.end(force);
  };

  isConnected = (): boolean => {
    return this.initialized ? this.mqttClient.connected : false;
  };

  isDisconnected = (): boolean => {
    return this.initialized ? this.mqttClient.disconnected : true;
  };

  isInterfaceAggregate = (interfaceName: string): boolean => {
    const defination = this.interfaces.filter(item => item.interface_name === interfaceName);
    if (!defination.length) {
      throw new Error('Interface not found in introspection');
    } else if (defination[0].aggregation === 'object') {
      return true;
    }
    return false;
  };

  isInterfaceIndividual = (interfaceName: string): boolean => {
    const defination = this.interfaces.filter(item => item.interface_name === interfaceName);
    if (!defination.length) {
      throw new Error('Interface not found in introspection');
    } else if (!defination[0].aggregation || defination[0].aggregation === 'individual') {
      return true;
    }
    return false;
  };

  isInterfaceOwnerServer = (interfaceName: string): boolean => {
    const defination = this.interfaces.filter(item => item.interface_name === interfaceName);
    if (!defination.length) {
      throw new Error('Interface not found in introspection');
    } else if (defination[0].ownership === 'server') {
      return true;
    }
    return false;
  };

  sendIndividual = async (
    interfaceName: string,
    interfacePath: string,
    value: string | number,
    timestamp?: Date,
  ): Promise<any> => {
    const path = `${this.realm}/${this.hardwareId}/${interfaceName}${interfacePath}`;
    const payload: any = {
      v: value,
    };

    if (timestamp) {
      payload.t = timestamp;
    }

    try {
      if (!this.isConnected()) {
        return;
      }

      if (!this.isInterfaceIndividual(interfaceName)) {
        throw new Error(
          'Only aggregation = individual interfaces are allowed, for aggregation = object interfaces use sendAggregate method',
        );
      }

      const result = await this.mqttClient.publish(path, serialize(payload), {
        qos: 0,
      });
      return result || true;
    } catch (err) {
      logger.error(`Data publish error on path ${path} for interface type individual`);
      logger.error(`Payload = ${JSON.stringify(payload)}`);
      throw err;
    }
  };

  sendAggregate = async (
    interfaceName: string,
    interfacePath: string,
    record: Record<string, any>,
    timestamp?: Date,
  ): Promise<any> => {
    const path = `${this.realm}/${this.hardwareId}/${interfaceName}${interfacePath}`;
    const payload: any = {
      v: record,
    };

    if (timestamp) {
      payload.t = timestamp;
    }

    try {
      if (!this.isConnected()) {
        return;
      }

      if (!this.isInterfaceAggregate(interfaceName)) {
        throw new Error(
          'Only aggregation = object interfaces are allowed, for aggregation = individual interfaces use sendIndividual method',
        );
      }

      const result = await this.mqttClient.publish(path, serialize(payload), {
        qos: 0,
      });
      return result || true;
    } catch (err) {
      logger.error(`Data publish error on path ${path} for interface type individual`);
      logger.error(`Payload = ${JSON.stringify(payload)}`);
      throw err;
    }
  };

  subscribe = (interfaceName: string): Promise<ISubscriptionGrant[]> => {
    if (!this.isConnected()) {
      return Promise.reject('MQTT Connection Failed');
    }

    if (!this.isInterfaceOwnerServer(interfaceName)) {
      throw new Error('Interface is not of server ownership');
    }

    return this.mqttClient.subscribe(`${this.realm}/${this.hardwareId}/${interfaceName}/#`, { qos: 0 });
  };

  public on(event: 'connect', cb: OnConnectCallback): any;
  public on(event: 'message', cb: OnMessageCallback): any;
  public on(event: 'packetsend' | 'packetreceive', cb: OnPacketCallback): any;
  public on(event: 'disconnect', cb: OnDisconnectCallback): any;
  public on(event: 'error', cb: OnErrorCallback): any;
  public on(event: 'close', cb: OnCloseCallback): any;
  public on(event: 'end' | 'reconnect' | 'offline' | 'outgoingEmpty', cb: () => void): any;
  public on(event: string, cb: Function): any {
    switch (event) {
      case 'message':
        this.mqttClient.on('message', (topic, payload, packet) => {
          cb(topic, deserialize(payload), packet);
        });
        break;
      default:
        this.mqttClient.on(event, cb);
        break;
    }
  }
}
