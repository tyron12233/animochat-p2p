
import { format } from "date-fns";
import { SwipeableMessage } from "./swipeable-message";
import { RefObject } from "react";
import { User, Message, ChatTheme } from "@/src/lib/types";

interface ChatMessageItemProps {
  index: number;
  message: any; // any for now
  user: User;
  isLast: boolean;
  onSwipe: (messageId: string) => void;
  onReact: (messageId: string, reaction?: string | null) => Promise<void>;
  // called when a swipe is started, to prevent the react menu from opening
  onStartedSwipe: () => void;
  onEndedSwipe: () => void;
  onOpenEmojiMenu: (message: Message | null) => void;
  onResendMessage: (message: Message) => void;
  isEmojiMenuOpen: RefObject<boolean>;
  theme?: ChatTheme;
  animate?: boolean;
  secondVisibleElement: string | null;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function ChatMessageItem({
  index,
  message,
  user,
  animate = false,
  isLast = false,
  onSwipe,
  onStartedSwipe,
  onEndedSwipe,
  onReact,
  onOpenEmojiMenu,
  onResendMessage,
  isEmojiMenuOpen,
  theme,
  secondVisibleElement,
  onLinkClick,
}: ChatMessageItemProps) {
  if (message.sender === "system") {
    return (
      <div
        key={message.id + "_system"}
        className="flex justify-center py-4 px-4 text-center"
      >
        <p className="text-xs text-gray-500">{message.content}</p>
      </div>
    );
  }

  const isAdvertisement = index % 5 === 0;
  const advertisementMessageId = isAdvertisement ? message.id : null;

  return (
    <div
      data-is-message="true"
      data-message-id={message.id}
      key={"parent_message_" + message.id}
      className="max-w-full w-full select-none"
    >
      {message.showTime && (
        <div key={message.id + "_time"} className="flex justify-center py-4">
          <p className="text-xs text-gray-500 font-normal">
            {message.created_at &&
              format(new Date(message.created_at), "h:mm a")}
          </p>
        </div>
      )}

      <SwipeableMessage
        advertisementMessageId={advertisementMessageId}
        key={message.id + "_message"}
        message={message}
        animate={animate}
        user={user}
        onSwipe={onSwipe}
        onStartedSwipe={onStartedSwipe}
        onEndedSwipe={onEndedSwipe}
        onReact={onReact}
        onOpenEmojiMenu={onOpenEmojiMenu}
        onResendMessage={onResendMessage}
        theme={theme}
        isEmojiMenuOpen={isEmojiMenuOpen}
        onLinkClick={onLinkClick}
      />

      {(isLast || !message.hasNext) && (
        <div key={message.id + "_bottom"} className="h-1" />
      )}
    </div>
  );
}
