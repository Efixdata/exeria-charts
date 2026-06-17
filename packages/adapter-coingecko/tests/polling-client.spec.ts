import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoingeckoApiClient } from "../src/api-client";
import { CoingeckoPollingClient } from "../src/polling-client";

describe("CoingeckoPollingClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("polls immediately and on interval", async () => {
    const getSimplePrice = vi
      .fn()
      .mockResolvedValue({
        bitcoin: { usd: 100, last_updated_at: 1_700_000_000 },
      });

    const apiClient = {
      getSimplePrice,
    } as unknown as CoingeckoApiClient;

    const pollingClient = new CoingeckoPollingClient(apiClient, {
      pollIntervalMs: 60_000,
    });

    const updates: number[] = [];
    const unsubscribe = pollingClient.subscribe("bitcoin", (tick) => {
      updates.push(tick.price ?? 0);
    });

    await vi.waitFor(() => {
      expect(getSimplePrice).toHaveBeenCalledTimes(1);
      expect(updates).toEqual([100]);
    });

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.waitFor(() => {
      expect(getSimplePrice).toHaveBeenCalledTimes(2);
      expect(updates).toEqual([100, 100]);
    });

    unsubscribe();
    pollingClient.disconnect();
  });

  it("shares one timer across multiple listeners", async () => {
    const getSimplePrice = vi
      .fn()
      .mockResolvedValue({
        bitcoin: { usd: 42, last_updated_at: 1_700_000_000 },
      });

    const apiClient = {
      getSimplePrice,
    } as unknown as CoingeckoApiClient;

    const pollingClient = new CoingeckoPollingClient(apiClient, {
      pollIntervalMs: 60_000,
    });

    const first: number[] = [];
    const second: number[] = [];

    const unsubscribeFirst = pollingClient.subscribe("bitcoin", (tick) => {
      first.push(tick.price ?? 0);
    });
    const unsubscribeSecond = pollingClient.subscribe("bitcoin", (tick) => {
      second.push(tick.price ?? 0);
    });

    await vi.waitFor(() => {
      expect(getSimplePrice).toHaveBeenCalledTimes(1);
      expect(first).toEqual([42]);
      expect(second).toEqual([42]);
    });

    unsubscribeFirst();
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.waitFor(() => {
      expect(getSimplePrice).toHaveBeenCalledTimes(2);
      expect(second).toEqual([42, 42]);
    });

    unsubscribeSecond();
    pollingClient.disconnect();
  });
});
