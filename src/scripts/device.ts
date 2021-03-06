/* eslint-disable no-dupe-class-members */
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

import mqtt, { AsyncMqttClient, ISubscriptionGrant } from 'async-mqtt';
import { deserialize, serialize } from 'bson';
import fs from 'fs';
import {
  IPublishPacket,
  OnCloseCallback,
  OnConnectCallback,
  OnDisconnectCallback,
  OnErrorCallback,
  OnMessageCallback,
  OnPacketCallback,
} from 'mqtt';
import Pairing from './pairing';
import logger from '../utils/logger';
import { DEVICE_INIT, INTERFACE_DEFINATION } from '../utils/types';
import { validate, validators } from '../utils/validator';

export default class Device extends Pairing {
  private mqttClient: AsyncMqttClient;
  private baseTopic: string;
  initialized = false;
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

    validate(validators.DEVICE_INIT, init);

    this.hardwareId = init.hardwareId;
    this.realm = init.realm;
    this.credentialSecret = init.credentialSecret;
    this.pairingUrl = init.pairingUrl;
    this.pairingToken = init.pairingToken;
    this.dir = init.dir;
    this.baseTopic = `${this.realm}/${this.hardwareId}`;

    if (init.LOG_LEVEL) {
      logger.level = init.LOG_LEVEL;
    }
  }

  addInterface(defination: INTERFACE_DEFINATION): void {
    validate(validators.INTERFACE_DEFINITION, defination);
    this.interfaces.push(defination);
  }

  removeInterface(interfaceName: string): void {
    validators.validateArgsInterfaceName([interfaceName]);
    this.interfaces = this.interfaces.filter(item => item.interface_name !== interfaceName);
    this.sendIntrospection();
  }

  private sendIntrospection = () => {
    if (this.interfaces.length) {
      const introspection = this.interfaces
        .map(item => {
          return `${item.interface_name}:${item.version_major}:${item.version_minor}`;
        })
        .join(';');

      logger.debug('Publishing Introspection');
      logger.debug(introspection);

      this.mqttClient.publish(`${this.baseTopic}`, introspection, { qos: 2 });
    }
  };

  connect = async (): Promise<boolean> => {
    try {
      if (this.isConnected()) {
        return true;
      }

      const certificate = await this.obtainCredentials({
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
        cert: certificate,
        key: privateKey,
      });

      if (this.mqttClient.connected) {
        logger.info('Connected to MQTT Broker');
        this.initialized = true;

        /* Send Initial Introspection */
        this.sendIntrospection();

        logger.debug('Publishing Empty Cache Control');
        this.mqttClient.publish(`${this.baseTopic}/control/emptyCache`, '1', { qos: 2 });

        logger.debug('Subscribing Properties');
        this.mqttClient.subscribe(`${this.baseTopic}/control/consumer/properties`, { qos: 0 });
      }
      return Promise.resolve(true);
    } catch (err) {
      logger.error('Failed to establish device connection with the broker');
      logger.error(err);
      throw err;
    }
  };

  disconnect = (force = false): Promise<void> => {
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

  private isInterfaceAggregate = (interfaceName: string): boolean => {
    validators.validateArgsInterfaceName([interfaceName]);
    const defination = this.interfaces.filter(item => item.interface_name === interfaceName);
    if (!defination.length) {
      throw new Error('Interface not found in introspection');
    } else if (defination[0].aggregation === 'object') {
      return true;
    }
    return false;
  };

  private isInterfaceIndividual = (interfaceName: string): boolean => {
    validators.validateArgsInterfaceName([interfaceName]);
    const defination = this.interfaces.filter(item => item.interface_name === interfaceName);
    if (!defination.length) {
      throw new Error('Interface not found in introspection');
    } else if (!defination[0].aggregation || defination[0].aggregation === 'individual') {
      return true;
    }
    return false;
  };

  private isInterfaceOwnerServer = (interfaceName: string): boolean => {
    validators.validateArgsInterfaceName([interfaceName]);
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
  ): Promise<IPublishPacket | boolean> => {
    validators.validateArgsPublishInvidual([interfaceName, interfacePath, value, timestamp]);

    const path = `${this.baseTopic}/${interfaceName}${interfacePath}`;
    const payload: any = {
      v: value,
    };

    if (timestamp) {
      payload.t = timestamp;
    }

    try {
      if (!this.isConnected()) {
        return false;
      }

      if (!this.isInterfaceIndividual(interfaceName)) {
        throw new Error(
          'Only aggregation = individual interfaces are allowed, for aggregation = object interfaces use sendAggregate method',
        );
      }

      const result = await this.mqttClient.publish(path, serialize(payload), {
        qos: 0,
      });
      return result;
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
  ): Promise<IPublishPacket | boolean> => {
    validators.validateArgsPublishAggregate([interfaceName, interfacePath, record, timestamp]);
    const path = `${this.baseTopic}/${interfaceName}${interfacePath}`;
    const payload: any = {
      v: record,
    };

    if (timestamp) {
      payload.t = timestamp;
    }

    try {
      if (!this.isConnected()) {
        return false;
      }

      if (!this.isInterfaceAggregate(interfaceName)) {
        throw new Error(
          'Only aggregation = object interfaces are allowed, for aggregation = individual interfaces use sendIndividual method',
        );
      }

      const result = await this.mqttClient.publish(path, serialize(payload), {
        qos: 0,
      });
      return result;
    } catch (err) {
      logger.error(`Data publish error on path ${path} for interface type individual`);
      logger.error(`Payload = ${JSON.stringify(payload)}`);
      throw err;
    }
  };

  subscribe = (interfaceName: string): Promise<ISubscriptionGrant[]> => {
    validators.validateArgsInterfaceName([interfaceName]);
    if (!this.isConnected()) {
      return Promise.reject(new Error('MQTT Connection Failed'));
    }

    if (!this.isInterfaceOwnerServer(interfaceName)) {
      throw new Error('Interface is not of server ownership');
    }

    return this.mqttClient.subscribe(`${this.baseTopic}/${interfaceName}/#`, { qos: 0 });
  };

  on(event: 'connect', cb: OnConnectCallback): any;
  on(event: 'message', cb: OnMessageCallback): any;
  on(event: 'packetsend' | 'packetreceive', cb: OnPacketCallback): any;
  on(event: 'disconnect', cb: OnDisconnectCallback): any;
  on(event: 'error', cb: OnErrorCallback): any;
  on(event: 'close', cb: OnCloseCallback): any;
  on(event: 'end' | 'reconnect' | 'offline' | 'outgoingEmpty', cb: () => void): any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  on(event: string, cb: Function): any {
    switch (event) {
      case 'message':
        this.mqttClient.on('message', (topic, payload, packet) => {
          if (Buffer.isBuffer(payload)) {
            const index = 0;
            const size =
              // eslint-disable-next-line no-bitwise
              payload[index] | (payload[index + 1] << 8) | (payload[index + 2] << 16) | (payload[index + 3] << 24);
            if (size >= 5) {
              cb(topic, deserialize(payload), packet);
            }
          } else {
            cb(topic, payload, packet);
          }
        });
        break;
      default:
        this.mqttClient.on(event, cb);
        break;
    }
  }
}
