/* eslint-disable @typescript-eslint/no-var-requires */
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

import fs from 'fs';
import path from 'path';
import logger from './logger';

const ECDSA = require('ecdsa-secp256r1');
const ECSA_CSR = require('ecdsa-csr');

export const generateCSR = async (realm: string, deviceId: string, dir: string): Promise<string> => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const keyFile = path.resolve(path.join(__dirname), `${dir}/${realm}__${deviceId}.key`);
  if (!fs.existsSync(keyFile)) {
    const keyPair = ECDSA.generateKey();
    const publicKey = keyPair.asPublic().toPEM();
    const privateKey = keyPair.toPEM();
    fs.writeFileSync(`${dir}/${realm}__${deviceId}.key`, privateKey);
    fs.writeFileSync(`${dir}/${realm}__${deviceId}.crt`, publicKey);
  }

  const privateKey = fs.readFileSync(`${dir}/${realm}__${deviceId}.key`);
  const csr = await ECSA_CSR({ key: privateKey, domains: [`${realm}/${deviceId}`, 'Devices'] });
  return csr.toString();
};

export const saveClientCertificate = (realm: string, deviceId: string, dir: string, certificate: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  logger.debug('Generating Client Certificate');
  fs.writeFileSync(`${dir}/${realm}__${deviceId}_client_certificate.crt`, certificate);
};

export const getClientCertificate = (realm: string, deviceId: string, dir: string): string => {
  logger.debug('Get Existing Client Certificate');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const clientCertificate = path.resolve(path.join(__dirname), `${dir}/${realm}__${deviceId}_client_certificate.crt`);
  if (fs.existsSync(clientCertificate)) {
    return fs.readFileSync(`${dir}/${realm}__${deviceId}_client_certificate.crt`).toString('utf-8');
  }
  logger.debug('Client Certificate not found');
  return '';
};
