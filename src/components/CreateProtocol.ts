export function createProtocol() {
    const pattern = /(\d{1})(\d{4})(\d{4})(\d{4})(\d{4})/;
    const randomNumber = Math.floor(Math.random() * 10); // Gera um dígito aleatório de 0 a 9
    const code = `${randomNumber.toString()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Aplica a expressão regular para formatar o x-xxxx-xxxx-xxxx-xxxx
    const formattedCode = code.replace(pattern, '$1-$2-$3-$4-$5');

    if (!formattedCode) {
        throw new Error('Erro ao criar o protocolo.');
    }

    return formattedCode;
}
