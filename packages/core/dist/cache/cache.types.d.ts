import { Cache } from "cache";
import { ClientResponseType } from "client";
import { CommandResponseDetails } from "managers";
export declare type CacheOptionsType = {
    storage?: CacheStorageType;
    onInitialization?: (cache: Cache) => void;
    onChange?: <Response = any, Error = any>(key: string, value: CacheValueType<Response, Error>, details: CommandResponseDetails) => void;
};
export declare type CacheValueType<Response = any, Error = any> = {
    data: ClientResponseType<Response, Error>;
    details: CommandResponseDetails;
    cacheTime: number;
};
export declare type CacheStorageSyncType = {
    set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => void;
    get: <Response, Error>(key: string) => CacheValueType<Response, Error> | undefined;
    keys: () => string[] | IterableIterator<string> | string[];
    delete: (key: string) => void;
    clear: () => void;
};
export declare type CacheStorageAsyncType = {
    set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => Promise<void>;
    get: <Response, Error>(key: string) => Promise<CacheValueType<Response, Error> | undefined>;
    keys: () => Promise<string[] | IterableIterator<string> | string[]>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
};
export declare type CacheStorageType = CacheStorageSyncType;
export declare type CacheInitialData = Record<string, CacheValueType>;
