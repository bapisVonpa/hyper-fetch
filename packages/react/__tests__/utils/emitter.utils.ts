import { EmitterOptionsType } from "@hyper-fetch/sockets";

import { socket } from "./socket.utils";

export const createEmitter = <ResponseType = { name: string; age: number }>(
  options?: Partial<EmitterOptionsType<any>>,
) => {
  return socket.createEmitter<ResponseType>({ name: "some-event", ...options });
};
