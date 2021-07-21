import fs from 'fs';
import path from 'path';
import logger from './logger';

const ECDSA = require('ecdsa-secp256r1');
const ECSA_CSR = require('ecdsa-csr');

export const generateCSR = async (realm: string, deviceId: string, dir: string) => {
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

export const saveClientCertificate = (realm: string, deviceId: string, dir: string, certificate: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  logger.debug('Generating Client Certificate');
  fs.writeFileSync(`${dir}/${realm}__${deviceId}_client_certificate.crt`, certificate);
};

export const getClientCertificate = (realm: string, deviceId: string, dir: string) => {
  logger.debug('Get Existing Client Certificate');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const clientCertificate = path.resolve(path.join(__dirname), `${dir}/${realm}__${deviceId}_client_certificate.crt`);
  if (fs.existsSync(clientCertificate)) {
    return fs.readFileSync(`${dir}/${realm}__${deviceId}_client_certificate.crt`);
  }
  logger.debug('Client Certificate not found');
  return false;
};
