export type ExternalNewsSentiment = "positive" | "negative" | "neutral";

export type ExternalNewsFeedPoint = {
  id: string;
  barIndex: number;
  sentiment: ExternalNewsSentiment;
};

let activeFeed: ExternalNewsFeedPoint[] = [];

export function setExternalNewsFeed(points: ExternalNewsFeedPoint[]): void {
  activeFeed = points;
}

export function getExternalNewsFeed(): ExternalNewsFeedPoint[] {
  return activeFeed;
}

export function clearExternalNewsFeed(): void {
  activeFeed = [];
}

export function findExternalNewsFeedPoint(barIndex: number): ExternalNewsFeedPoint | undefined {
  return activeFeed.find((point) => point.barIndex === barIndex);
}
