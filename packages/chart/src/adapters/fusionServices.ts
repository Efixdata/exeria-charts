export interface FusionPaymentsService {
  isSubscriptionPackEnabled(subscriptionPack: string): boolean;
}

export interface FusionDatasourceService<TInstrument = unknown, TLoadResponse = unknown> {
  loadInstrumentCandles(
    instrument: TInstrument,
    intervalSymbol: string,
    from: unknown,
    to: unknown,
    onSuccess: (data: TLoadResponse) => void,
    onError: (error: unknown) => void,
  ): void;
  loadCandlesHistory(
    limit: number,
    intervalSymbol: string,
    from: unknown,
    to: number,
    instruments: Array<TInstrument | undefined>,
    onSuccess: (data: Record<string, TLoadResponse> | TLoadResponse) => void,
    onError: (error: unknown) => void,
  ): void;
}

export interface FusionServicesAdapter<TInstrument = unknown, TLoadResponse = unknown> {
  payments: FusionPaymentsService;
  datasource: FusionDatasourceService<TInstrument, TLoadResponse>;
}

type GlobalServicesHost<TInstrument = unknown, TLoadResponse = unknown> = typeof globalThis & {
  SERVICES?: FusionServicesAdapter<TInstrument, TLoadResponse>;
};

function getGlobalServicesHost<TInstrument = unknown, TLoadResponse = unknown>() {
  return globalThis as GlobalServicesHost<TInstrument, TLoadResponse>;
}

export function getFusionServices<TInstrument = unknown, TLoadResponse = unknown>() {
  return getGlobalServicesHost<TInstrument, TLoadResponse>().SERVICES ?? null;
}

export function requireFusionServices<TInstrument = unknown, TLoadResponse = unknown>() {
  const services = getFusionServices<TInstrument, TLoadResponse>();

  if (!services) {
    throw new Error("FUSION SERVICES global is not available");
  }

  return services;
}