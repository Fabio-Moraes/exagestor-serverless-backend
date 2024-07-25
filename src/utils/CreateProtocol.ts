import Crypto from 'crypto';

export function createProtocol(length: number) {
  const randomBuffer = Crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomBuffer[i] % 10;
  }
  return code;
}
