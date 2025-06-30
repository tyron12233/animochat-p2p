import { format } from "date-fns";
import { SwipeableMessage } from "./swipeable-message";
import { RefObject } from "react";
import { User, Message } from "@/src/lib/types";
import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { defaultTheme } from "@/src/lib/default-chat-themes";
import { Participant } from "@/src/hooks/useAnimochat";

interface ChatMessageItemProps {
  participants: Participant[]
  index: number;
  message: any; // any for now
  user: User;
  isLast: boolean;
  onSwipe: (messageId: string) => void;
  onReact: (messageId: string, reaction: string | null) => Promise<void>;
  // called when a swipe is started, to prevent the react menu from opening
  onStartedSwipe: () => void;
  onEndedSwipe: () => void;
  onOpenEmojiMenu: (message: Message | null) => void;
  onResendMessage: (message: Message) => void;
  isEmojiMenuOpen: RefObject<boolean>;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  animate?: boolean;
  secondVisibleElement: string | null;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function ChatMessageItem({
  participants=[],
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
  theme = defaultTheme,
  mode,
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
  const showName =
    ((message as any)?.senderNickname && (message as any)?.showName) && message.sender !== user.id;
  let name = null;
  if (showName) {
    name = message.senderNickname;
  }

  return (
    <div
      data-is-message="true"
      data-message-id={message.id}
      key={"parent_message_" + message.id}
      className="max-w-full w-full select-none overflow-x-clip"
    >
      {message.showTime && (
        <div key={message.id + "_time"} className="flex justify-center py-4">
          <p
            className="text-xs font-normal"
            style={{
              color: theme.message.systemMessage.text[mode],
            }}
          >
            {message.created_at &&
              format(new Date(message.created_at), "h:mm a")}
          </p>
        </div>
      )}

      <SwipeableMessage
        name={name}
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
        mode={mode}
        isEmojiMenuOpen={isEmojiMenuOpen}
        onLinkClick={onLinkClick}
      />

      {(isLast || !message.hasNext) && (
        <div key={message.id + "_bottom"} className="h-1" />
      )}
    </div>
  );
}

export const bumbleTheme: ChatThemeV2 = {
  name: "🐝 Theme",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#FFCB37", dark: "#FFD966" },
    faded: {
      light: "rgba(255, 203, 55, 0.15)",
      dark: "rgba(255, 217, 102, 0.15)",
    },
  },
  secondaryText: { light: "#707070", dark: "#A0A0A0" },
  errorText: { light: "#D9534F", dark: "#f87171" },
  linkColor: { light: "#FFCB37", dark: "#FFD966" },
  announcement: {
    background: { light: "#FFFBEB", dark: "#3A301A" },
    text: { light: "#282828", dark: "#FFFBEB" },
    border: { light: "#FEEBC8", dark: "#4A3C22" },
  },
  animations: {
    typingIndicatorDots: {
      dark: "#FFFBEB",
      light: "#333333",
    },
  },
  messageList: {
    scrollbarThumb: { light: "#FFD966", dark: "#5A4C29" },
    scrollbarTrack: { light: "#FFFBEB", dark: "#1E1E1E" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#FFFFFF", dark: "#1E1E1E" },
      shadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    replyingPreview: {
      background: { light: "#F0F0F0", dark: "#2C2C2C" },
      border: { light: "#FFCB37", dark: "#FFD966" },
      closeIcon: {
        light: "#707070",
        dark: "#A0A0A0",
      },
      description: {
        light: "#333333",
        dark: "#F0F0F0",
      },
      title: {
        light: "#222222",
        dark: "#FFFFFF",
      },
    },
  },
  general: {
    background: { light: "#FFFFFF", dark: "#121212" },
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: {
      light: "rgba(255, 255, 255, 0.8)",
      dark: "rgba(30, 30, 30, 0.8)",
    },
    border: {
      light: "rgba(240, 240, 240, 0.8)",
      dark: "rgba(44, 44, 44, 0.8)",
    },
    statusLabel: { light: "#707070", dark: "#A0A0A0" },
    statusValue: { light: "#333333", dark: "#FFD966" },
  },
  message: {
    myMessage: {
      background: { light: "#FFCB37", dark: "#FFD966" },
      text: { light: "#222222", dark: "#222222" },
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#F0F0F0", dark: "#2C2C2C" },
      text: { light: "#222222", dark: "#FFFFFF" },
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "#F0F0F0", dark: "#2C2C2C" },
      text: { light: "#707070", dark: "#A0A0A0" },
    },
    deletedMessage: {
      text: { light: "#A0A0A0", dark: "#707070" },
    },
    imageOverlay: {
      background: { light: "rgba(0, 0, 0, 0.4)", dark: "rgba(0, 0, 0, 0.4)" },
      text: { light: "#ffffff", dark: "#ffffff" },
    },
  },
  inputArea: {
    background: {
      light: "rgba(255, 255, 255, 0.8)",
      dark: "rgba(30, 30, 30, 0.8)",
    },
    border: {
      light: "rgba(240, 240, 240, 0.8)",
      dark: "rgba(44, 44, 44, 0.8)",
    },
    inputBackground: { light: "#FFFFFF", dark: "#2C2C2C" },
    inputText: { light: "#222222", dark: "#FFFFFF" },
    placeholderText: { light: "#A0A0A0", dark: "#707070" },
    focusRing: { light: "#FFD966", dark: "#FFCB37" },
  },
  buttons: {
    primary: {
      background: { light: "#FFCB37", dark: "#FFD966" },
      text: { light: "#222222", dark: "#222222" },
      hoverBackground: { light: "#FFD966", dark: "#FFCB37" },
    },
    secondary: {
      background: { light: "#FFFFFF", dark: "#2C2C2C" },
      text: { light: "#222222", dark: "#FFFFFF" },
      hoverBackground: { light: "#F0F0F0", dark: "#3C3C3C" },
      border: { light: "#F0F0F0", dark: "#3C3C3C" },
    },
    destructive: {
      background: { light: "#D9534F", dark: "#D9534F" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#C9302C", dark: "#C9302C" },
      border: { light: "#D43F3A", dark: "#D43F3A" },
    },
    newMessages: {
      background: { light: "#FFCB37", dark: "#FFD966" },
      text: { light: "#222222", dark: "#222222" },
      hoverBackground: { light: "#FFD966", dark: "#FFCB37" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#F0F0F0", dark: "#3C3C3C" },
      border: { light: "#FFFFFF", dark: "#121212" },
      text: { light: "#222222", dark: "#FFFFFF" },
    },
  },
};
