import { act } from "react-dom/test-utils";
import { CacheValueType } from "@hyper-fetch/core";

import { startServer, resetInterceptors, stopServer } from "../../server";
import { client, createRequest } from "../../utils";
import { renderUseCache } from "../../utils/use-cache.utils";
import { testInitialState, testSuccessState } from "../../shared";

describe("useCache [ Base ]", () => {
  let request = createRequest();
  const cacheData: CacheValueType = {
    data: [{ test: 1 }, null, 200],
    details: {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime: request.cacheTime,
    clearKey: request.client.cache.clearKey,
    garbageCollection: Infinity,
  };

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    client.clear();
    request = createRequest();
  });

  describe("given hook is mounting", () => {
    describe("when cache data read is pending", () => {
      it("should initialize with non-loading state", async () => {
        const { result } = renderUseCache(request);

        expect(result.current.loading).toBeFalse();
      });
    });
  });
  describe("given cache is empty", () => {
    describe("when reading the state", () => {
      it("should return empty state", async () => {
        const response = renderUseCache(request);

        testInitialState(response, false);
      });
    });
  });
  describe("given cache is present", () => {
    describe("when reading the state", () => {
      it("should return state", async () => {
        client.cache.set(request, cacheData.data, cacheData.details);
        const response = renderUseCache(request);

        await testSuccessState(cacheData.data[0], response);
        expect(+response.result.current.timestamp).toBe(cacheData.details.timestamp);
        expect(response.result.current.retries).toBe(0);
      });
      it("should allow to revalidate by Request", async () => {
        const spy = jest.spyOn(client.cache, "revalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.revalidate(request);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
      it("should allow to revalidate by RegExp", async () => {
        const spy = jest.spyOn(client.cache, "revalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.revalidate(new RegExp(request.cacheKey));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(new RegExp(request.cacheKey));
      });
      it("should allow to revalidate by cacheKey", async () => {
        const spy = jest.spyOn(client.cache, "revalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.revalidate(request.cacheKey);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
      it("should allow to revalidate by default key", async () => {
        const spy = jest.spyOn(client.cache, "revalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.revalidate();
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
    });
  });
});
