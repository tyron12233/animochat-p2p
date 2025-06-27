
import { RefObject, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  LongPressEventType,
  LongPressResult,
  LongPressTouchHandlers,
  useLongPress,
} from "use-long-press";
import { SmileIcon } from "lucide-react";
import "./swipeable-message.css";
import "./chat-message-item.css";

import { getTextColor } from "@/src/lib/color-utils";
import Linkify from "react-linkify";
import MessageBubble from "./message-bubble";
import { SwipeIcon } from "./swipe-icon";
import { ChatTheme, DEFAULT_THEME, Message, User } from "@/src/lib/types";

export const SWIPE_THRESHOLD = 50;
export const TAP_THRESHOLD = 5;

export interface MessageProps {
  message: Message;
  animate?: boolean;
  user: User;
  onSwipe: (messageId: string) => void;
  onReact: (messageId: string, emoji: string | null) => void;
  onStartedSwipe: () => void;
  onEndedSwipe: () => void;
  onOpenEmojiMenu?: (message: Message | null) => void;
  onResendMessage?: (message: Message) => void;
  theme?: ChatTheme;
  advertisementMessageId?: string | null;
  isEmojiMenuOpen?: RefObject<boolean>;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export function SwipeableMessage({
  message,
  user,
  onSwipe,
  onReact,
  onStartedSwipe,
  onEndedSwipe,
  animate = false,
  theme = DEFAULT_THEME,
  advertisementMessageId,
  onOpenEmojiMenu = () => {},
  onResendMessage = () => {},
  isEmojiMenuOpen,
  onLinkClick,
}: MessageProps) {
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);


  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    setIsTouchDevice(isTouch);
  }, []);

  return (
    <div
      data-message-id={"message-" + message.id}
      className="relative px-4 select-none"
      onMouseEnter={() => !isTouchDevice && setHovered(true)}
      onMouseLeave={() => !isTouchDevice && setHovered(false)}
    >
      <div
        key="parent-message-bubble flex flex-col"
      >
        <MessageBubble
          onLinkClick={onLinkClick}
          animate={animate}
          key={message.id + "-bubble"}
          message={message}
          user={user}
          hovered={hovered}
          reply={() => onSwipe(message.id)}
          onOpenEmojiMenu={() => onOpenEmojiMenu(message)}
          onReact={(emoji) => onReact(message.id, emoji)}
          onResendMessage={onResendMessage}
          theme={theme}
          advertisementMessageId={advertisementMessageId}
        />
      </div>
    </div>
  );
}

interface TouchState {
  startX: number;
  currentX: number;
  messageId: string | null;
}

/* Helper Functions */
function toggleChatContainerScroll(enable: boolean) {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    if (enable) chatContainer.classList.remove("overflow-y-hidden");
    else chatContainer.classList.add("overflow-y-hidden");
  }
}

// Allow scolling only when needed
const toggleBodyScroll = (disable: boolean) => {
  if (disable) {
    document.body.style.overflow = "hidden"; // Disable scrolling
  } else {
    document.body.style.overflow = ""; // Re-enable scrolling
  }
};

function getSelectedEmoji(): string | undefined {
  const emojiContainer = document.getElementById("emoji-container");
  if (!emojiContainer) return undefined;
  const emojis = emojiContainer.getElementsByClassName("emoji");
  for (let i = 0; i < emojis.length; i++) {
    if (emojis[i].classList.contains("selected")) {
      return emojis[i].textContent || undefined;
    }
  }
  return undefined;
}

