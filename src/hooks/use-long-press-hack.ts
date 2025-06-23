import { useCallback, useRef } from "react";
import type { TouchEvent, TouchEventHandler } from "react";

interface LongPressOptions {
  delay?: number;
}

/**
 * A hook to detect long press events on touch devices.
 *
 * It sets a timer when the user touches the element and calls the provided
 * callback if the press lasts longer than the specified delay.
 * Additionally, if the user has not moved their finger, it stops the event propagation
 * on touch end.
 *
 * @param callback - Function to call when a long press is detected.
 * @param options - Optional configuration object ({ delay: number }).
 * @returns Object containing touch event handlers.
 */
export function useLongPressHack<T extends HTMLElement>(
  callback: (event: TouchEvent<T>) => void,
  { delay = 500 }: LongPressOptions = {}
) {
  const timerRef = useRef<number | null>(null);
  // This ref tracks if the user moved during the touch.
  const hasMovedRef = useRef<boolean>(false);

  // Clears the long press timer.
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Starts the long press timer.
  const onTouchStart: TouchEventHandler<T> = useCallback(
    (event) => {
      hasMovedRef.current = false;
      timerRef.current = window.setTimeout(() => {
        callback(event);
      }, delay);
    },
    [callback, delay]
  );

  // Marks that a move occurred and cancels the timer.
  const onTouchMove: TouchEventHandler<T> = useCallback(
    (event) => {
      hasMovedRef.current = true;
      clearTimer();
    },
    [clearTimer]
  );

  // On touch end, stops propagation if the user hasn't moved, and clears the timer.
  const onTouchEnd: TouchEventHandler<T> = useCallback(
    (event) => {
      if (!hasMovedRef.current) {
        event.stopPropagation();
      }
      clearTimer();
    },
    [clearTimer]
  );

  // Clears the timer if the touch is canceled.
  const onTouchCancel: TouchEventHandler<T> = useCallback(
    (event) => {
      clearTimer();
    },
    [clearTimer]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}
