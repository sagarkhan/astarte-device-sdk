import fs from 'fs';
import path from 'path';

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
