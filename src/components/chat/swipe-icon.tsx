import { SWIPE_THRESHOLD } from "./swipeable-message";

interface SwipeIconProps {
  isUserMessage: boolean;
  swipeOffset: number;
}

export function SwipeIcon({ isUserMessage, swipeOffset }: SwipeIconProps) {
  const opacity = Math.abs(swipeOffset) / SWIPE_THRESHOLD;
  return (
    <div
      className={`absolute top-1 transition-opacity ${
        isUserMessage ? "left-2" : "right-2"
      }`}
      style={{ opacity }}
    >
      <div className="rounded-full bg-green-100 p-2">
        <svg
          className="w-4 h-4 text-green-600"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </div>
    </div>
  );
}