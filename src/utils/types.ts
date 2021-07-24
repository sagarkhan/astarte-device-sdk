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

import { ConfigsSchema } from './configs';

export type INTROSPECTION_CONFIG = {
  [key: string]: {
    major: number;
    minor: number;
  };
};

export type REGISTER_CONFIGS = {
  hardwareId: string;
  initialIntrospection?: INTROSPECTION_CONFIG;
};

export type PAIRING_INIT = ConfigsSchema & {
  pairingUrl: string;
  pairingToken: string;
  realm: string;
};

export type OBTAIN_CONNECTION_INFO = {
  hardwareId: string;
  credentialSecret: string;
};

export type OBTAIN_CERTS = OBTAIN_CONNECTION_INFO & {
  dir: string;
};

export type VALIDATE_CERTS = OBTAIN_CONNECTION_INFO & {
  clientCertificate: string | Buffer;
};

export type DEVICE_INIT = ConfigsSchema & {
  hardwareId: string;
  realm: string;
  credentialSecret: string;
  pairingUrl: string;
  pairingToken: string;
  dir: string;
};

export enum INTERFACE_TYPES {
  DATASTREAM = 'datastream',
  PROPERTIES = 'properties',
}

export enum INTERFACE_OWNERSHIP {
  DEVICE = 'device',
  SERVER = 'server',
}

export enum INTERFACE_AGGREGATION {
  INDIVIDUAL = 'individual',
  OBJECT = 'object',
}

export type INTERFACE_DEFINATION = {
  interface_name: string;
  version_major: number;
  version_minor: number;
  type: 'datastream' | 'properties';
  ownership: 'device' | 'server';
  aggregation?: 'individual' | 'object';
  mappings?: Record<string, any>;
};
