import Crypto from 'crypto';

export function createProtocol(length: number) {
  const randomBuffer = Crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomBuffer[i] % 10; // Reduz o valor para estar entre 0 e 9
  }
  return code;
}

/* export function createProtocol() {
    const pattern = /(\d{1})(\d{4})(\d{4})(\d{4})(\d{4})/;
    const randomNumber = Math.floor(Math.random() * 10); // Gera um dígito aleatório de 0 a 9
    const code = `${randomNumber.toString()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Aplica a expressão regular para formatar o x-xxxx-xxxx-xxxx-xxxx
    const formattedCode = code.replace(pattern, '$1-$2-$3-$4-$5');

    if (!formattedCode) {
        throw new Error('Erro ao criar o protocolo.');
    }

    return formattedCode;
} */
