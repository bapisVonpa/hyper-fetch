import { FetchCommandInstance } from "command";
import { QueueRequestType } from "queue";

// Queue

export const getStorageKey = (queueKey: string): string => {
  return `KEY:[${queueKey}]_DATE:[${+new Date()}]`;
};

// Events

export const getQueueLoadingEventKey = (key: string): string => {
  return `${key}-loading-event`;
};
export const getQueueDrainedEventKey = (key: string): string => {
  return `${key}-drained-event`;
};
export const getQueueStatusEventKey = (key: string): string => {
  return `${key}-status-event`;
};
export const getQueueChangeEventKey = (key: string): string => {
  return `${key}-queue-event`;
};

// Requesting

export const getIsEqualTimestamp = (currentTimestamp: number, threshold: number, queueTimestamp?: number): boolean => {
  if (!queueTimestamp) {
    return false;
  }

  return queueTimestamp - currentTimestamp <= threshold;
};

export const canRetryRequest = (retries: number, retry: number | boolean | undefined) => {
  if (retry === true) {
    return true;
  }
  if (retry && retries <= retry) {
    return true;
  }
  return false;
};

export const getRequestType = (command: FetchCommandInstance, hasRequests: boolean) => {
  const { concurrent, cancelable, deduplicate } = command;

  if (!concurrent) {
    return QueueRequestType.oneByOne;
  }
  if (cancelable) {
    return QueueRequestType.previousCanceled;
  }
  if (hasRequests && deduplicate) {
    return QueueRequestType.deduplicated;
  }
  return QueueRequestType.allAtOnce;
};