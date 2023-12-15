import { websocket } from '../../../../../services/websocket'

interface Props { token: string, employee_id: string }

export async function executeWebsocket(props: Props) {
  const { token, employee_id } = props;

  let socket = websocket(token);

  const connectSocket = async () => {
    return new Promise<void>((resolve) => {
      socket = websocket(token);
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        resolve();
      });
      socket.emit('RUNNING_UPDATE', JSON.stringify({ employee_id }));
    });
  };

  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      await connectSocket();
      return;
    } catch (connectError: unknown) {
      retryCount += 1;

      if (connectError instanceof Error) {
        console.log(`Tentativa ${retryCount} de conexão falhou: ${connectError.message}`);
      } else {
        console.log(`Tentativa ${retryCount} de conexão falhou com erro desconhecido`);
      }
    }
  }
} 