import { useCallback, useRef, useState, type TouchEventHandler } from "react";

type UsePullToRefreshOptions = {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  threshold?: number;
};

type PullToRefreshHandlers = {
  onTouchStart: TouchEventHandler<HTMLElement>;
  onTouchMove: TouchEventHandler<HTMLElement>;
  onTouchEnd: TouchEventHandler<HTMLElement>;
};

export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 72,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const updatePullDistance = useCallback((value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  }, []);

  const onTouchStart = useCallback<TouchEventHandler<HTMLElement>>(
    (event) => {
      if (disabled || refreshing) {
        return;
      }

      if (event.currentTarget.scrollTop > 0) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      startYRef.current = touch.clientY;
      pullingRef.current = false;
    },
    [disabled, refreshing],
  );

  const onTouchMove = useCallback<TouchEventHandler<HTMLElement>>(
    (event) => {
      if (!pullingRef.current || startYRef.current == null || disabled || refreshing) {
        return;
      }

      const touch = event.touches[0];
      if (!touch || startYRef.current == null) {
        return;
      }

      const delta = touch.clientY - startYRef.current;

      if (delta > 6 && event.currentTarget.scrollTop <= 0) {
        pullingRef.current = true;
        updatePullDistance(Math.min(delta * 0.5, threshold * 1.35));
        return;
      }

      if (delta < -6) {
        pullingRef.current = false;
        updatePullDistance(0);
      }
    },
    [disabled, refreshing, threshold, updatePullDistance],
  );

  const onTouchEnd = useCallback<TouchEventHandler<HTMLElement>>(() => {
    if (!pullingRef.current) {
      return;
    }

    pullingRef.current = false;
    startYRef.current = null;

    const distance = pullDistanceRef.current;

    if (distance >= threshold && !refreshing) {
      setRefreshing(true);
      updatePullDistance(threshold * 0.55);

      void Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
        updatePullDistance(0);
      });
      return;
    }

    updatePullDistance(0);
  }, [onRefresh, refreshing, threshold, updatePullDistance]);

  const handlers: PullToRefreshHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return {
    handlers,
    pullDistance,
    refreshing,
    pullProgress: Math.min(1, pullDistance / threshold),
  };
}
