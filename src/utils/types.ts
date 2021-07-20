export type INTROSPECTION_CONFIG = {
  [key: string]: {
    major: Number;
    minor: Number;
  };
};

export type REGISTER_CONFIGS = {
  hardwareId: string;
  initialIntrospection?: INTROSPECTION_CONFIG;
};

export type PAIRING_INIT = {
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

export type DEVICE_INIT = {
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
