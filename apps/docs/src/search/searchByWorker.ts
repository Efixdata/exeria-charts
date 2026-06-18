import * as Comlink from "comlink";

type SearchWorkerApi = {
  fetchIndexes(baseUrl: string, searchContext: string): Promise<void>;
  search(
    baseUrl: string,
    searchContext: string,
    input: string,
    limit: number,
  ): Promise<unknown[]>;
};

let remoteWorkerPromise: Promise<Comlink.Remote<SearchWorkerApi>> | undefined;

function getRemoteWorker(): Promise<Comlink.Remote<SearchWorkerApi>> {
  if (!remoteWorkerPromise) {
    remoteWorkerPromise = (async () => {
      const Remote = Comlink.wrap<SearchWorkerApi>(
        new Worker(new URL("./worker.js", import.meta.url)),
      );
      return Remote as unknown as Comlink.Remote<SearchWorkerApi>;
    })();
  }

  return remoteWorkerPromise;
}

export async function fetchIndexesByWorker(baseUrl: string, searchContext: string): Promise<void> {
  const remoteWorker = await getRemoteWorker();
  await remoteWorker.fetchIndexes(baseUrl, searchContext);
}

export async function searchByWorker(
  baseUrl: string,
  searchContext: string,
  input: string,
  limit: number,
): Promise<unknown[]> {
  const remoteWorker = await getRemoteWorker();
  return remoteWorker.search(baseUrl, searchContext, input, limit);
}
