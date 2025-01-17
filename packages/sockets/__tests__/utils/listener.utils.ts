import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenerOptionsType } from "listener";

export const createListener = <ResponseType = any>(
  socket: SocketInstance,
  options?: Partial<ListenerOptionsType<any>>,
) => {
  const randomKey = getUniqueRequestId("some-event-listener");
  return socket.createListener<ResponseType>({ name: randomKey, ...options });
};
