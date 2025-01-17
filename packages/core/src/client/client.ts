import {
  AdapterType,
  adapter as defaultAdapter,
  AdapterOptionsType,
  ResponseType,
  QueryParamsType,
  QueryStringifyOptionsType,
  HeaderMappingType,
  AdapterPayloadMappingType,
} from "adapter";
import {
  stringifyQueryParams,
  getAdapterHeaders,
  getAdapterPayload,
  ClientOptionsType,
  ClientInstance,
  ClientErrorType,
  StringifyCallbackType,
  RequestInterceptorType,
  ResponseInterceptorType,
} from "client";
import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { RequestEffectInstance } from "effect";
import { Request, RequestOptionsType, RequestInstance } from "request";
import { AppManager, RequestManager, LoggerManager, SeverityType } from "managers";
import { interceptRequest, interceptResponse } from "./client.utils";

/**
 * **Client** is a class that allows you to configure the connection with the server and then use it to create
 * requests which, when called using the appropriate method, will cause the server to be queried for the endpoint and
 * method specified in the request.
 * @position 1
 */
export class Client<GlobalErrorType extends ClientErrorType = Error, AdapterOptions = AdapterOptionsType> {
  readonly url: string;
  public debug: boolean;

  // Private
  __onErrorCallbacks: ResponseInterceptorType[] = [];
  __onSuccessCallbacks: ResponseInterceptorType[] = [];
  __onResponseCallbacks: ResponseInterceptorType[] = [];
  __onAuthCallbacks: RequestInterceptorType[] = [];
  __onRequestCallbacks: RequestInterceptorType[] = [];

  // Managers
  requestManager: RequestManager = new RequestManager();
  appManager: AppManager;
  loggerManager: LoggerManager = new LoggerManager(this);

  // Config
  adapter: AdapterType;
  cache: Cache;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;

  // Registered requests effect
  effects: RequestEffectInstance[] = [];

  // Options
  queryParamsConfig?: QueryStringifyOptionsType;
  adapterDefaultOptions?: (request: RequestInstance) => AdapterOptions;
  requestDefaultOptions?: (
    options: RequestOptionsType<string, AdapterOptions>,
  ) => Partial<RequestOptionsType<string, AdapterOptions>>;

  // Utils

  /**
   * Method to stringify query params from objects.
   */
  stringifyQueryParams: StringifyCallbackType = (queryParams) =>
    stringifyQueryParams(queryParams, this.queryParamsConfig);
  /**
   * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
   */
  headerMapper: HeaderMappingType = getAdapterHeaders;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: AdapterPayloadMappingType = getAdapterPayload;

  // Logger
  logger = this.loggerManager.init("Client");

  constructor(public options: ClientOptionsType) {
    const { url, adapter, appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
    this.url = url;
    this.adapter = adapter || defaultAdapter;

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies injection
    this.appManager = appManager?.(this) || new AppManager();
    this.cache = cache?.(this) || new Cache(this);
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  }

  /**
   * This method allows to configure global defaults for the request configuration like method, auth, deduplication etc.
   */
  setRequestDefaultOptions = (
    callback: (request: RequestInstance) => Partial<RequestOptionsType<string, AdapterOptions>>,
  ): Client<GlobalErrorType, AdapterOptions> => {
    this.requestDefaultOptions = callback;
    return this;
  };

  setAdapterDefaultOptions = (
    callback: (request: RequestInstance) => AdapterOptions,
  ): Client<GlobalErrorType, AdapterOptions> => {
    this.adapterDefaultOptions = callback;
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): Client<GlobalErrorType, AdapterOptions> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType): Client<GlobalErrorType, AdapterOptions> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the Client
   */
  setLogger = (callback: (Client: ClientInstance) => LoggerManager): Client<GlobalErrorType, AdapterOptions> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (queryParamsConfig: QueryStringifyOptionsType): Client<GlobalErrorType, AdapterOptions> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the Client
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): Client<GlobalErrorType, AdapterOptions> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: HeaderMappingType): Client<GlobalErrorType, AdapterOptions> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (payloadMapper: AdapterPayloadMappingType): Client<GlobalErrorType, AdapterOptions> => {
    this.payloadMapper = payloadMapper;
    return this;
  };

  /**
   * Set custom http adapter to handle graphql, rest, firebase or other
   */
  setAdapter = (callback: (Client: ClientInstance) => AdapterType): Client<GlobalErrorType, AdapterOptions> => {
    this.adapter = callback(this);
    return this;
  };

  /**
   * Method of manipulating requests before sending the request. We can for example add custom header with token to the request which request had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorType): Client<GlobalErrorType, AdapterOptions> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, AdapterOptions> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, AdapterOptions> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<GlobalErrorType, AdapterOptions> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, AdapterOptions> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Add persistent effects which trigger on the request lifecycle
   */
  addEffect = (effect: RequestEffectInstance | RequestEffectInstance[]) => {
    this.effects = this.effects.concat(effect);

    return this;
  };

  /**
   * Remove effects from Client
   */
  removeEffect = (effect: RequestEffectInstance | string) => {
    const name = typeof effect === "string" ? effect : effect.getEffectKey();
    this.effects = this.effects.filter((currentEffect) => currentEffect.getEffectKey() !== name);

    return this;
  };

  /**
   * Helper used by http adapter to apply the modifications on response error
   */
  __modifyAuth = async (request: RequestInstance) => interceptRequest(this.__onAuthCallbacks, request);

  /**
   * Private helper to run async pre-request processing
   */
  __modifyRequest = async (request: RequestInstance) => interceptRequest(this.__onRequestCallbacks, request);

  /**
   * Private helper to run async on-error response processing
   */
  __modifyErrorResponse = async (response: ResponseType<any, GlobalErrorType>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType>(this.__onErrorCallbacks, response, request);

  /**
   * Private helper to run async on-success response processing
   */
  __modifySuccessResponse = async (response: ResponseType<any, GlobalErrorType>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType>(this.__onSuccessCallbacks, response, request);

  /**
   * Private helper to run async response processing
   */
  __modifyResponse = async (response: ResponseType<any, GlobalErrorType>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType>(this.__onResponseCallbacks, response, request);

  /**
   * Clears the Client instance and remove all listeners on it's dependencies
   */
  clear = () => {
    const { appManager, cache, fetchDispatcher, submitDispatcher } = this.options;

    this.requestManager.abortControllers.clear();
    this.fetchDispatcher.clear();
    this.submitDispatcher.clear();
    this.cache.clear();

    this.requestManager.emitter.removeAllListeners();
    this.fetchDispatcher.emitter.removeAllListeners();
    this.submitDispatcher.emitter.removeAllListeners();
    this.cache.emitter.removeAllListeners();

    this.appManager = appManager?.(this) || new AppManager();
    this.cache = cache?.(this) || new Cache(this);
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  };

  /**
   * Create requests based on the Client setup
   */
  createRequest = <
    Response,
    Payload = undefined,
    LocalError extends ClientErrorType | undefined = undefined,
    QueryParams extends QueryParamsType | string = QueryParamsType | string,
  >() => {
    return <EndpointType extends string>(params: RequestOptionsType<EndpointType, AdapterOptions>) =>
      new Request<Response, Payload, QueryParams, GlobalErrorType, LocalError, EndpointType, AdapterOptions>(
        this,
        params,
      );
  };
}
