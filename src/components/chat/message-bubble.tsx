import { getTextColor } from "@/src/lib/color-utils";
import Linkify from "linkify-react";
import {
  motion,
  PanInfo,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  LongPressResult,
  LongPressTouchHandlers,
  useLongPress,
} from "use-long-press";
import ActionIcons from "./action-icons";
import ReplyIndicator from "./reply-indicator";
import ReactionBubble from "./reaction-bubble";
import { SwipeIcon } from "./swipe-icon";
import { cn } from "@/src/lib/utils";
import { Reply } from "lucide-react";
import { useLongPressHack } from "@/src/hooks/use-long-press-hack";
import Image from "next/image";
import { useState } from "react";
import { PhotoView } from "react-photo-view";
import { ChatTheme, DEFAULT_THEME, Message, User } from "@/src/lib/types";

function isOnlyEmojis(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  // Remove all whitespace
  const noSpaces = trimmed.replace(/\s+/g, "");
  // This regex uses Unicode property escapes to match emoji.
  // (Note: Ensure your environment supports Unicode regex.)
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const matches = noSpaces.match(emojiRegex);
  // If there are matches and their concatenation equals the full string,
  // then the string is composed solely of emojis.
  return matches ? matches.join("") === noSpaces : false;
}

function countEmojis(str: string): number {
  const noSpaces = str.trim().replace(/\s+/g, "");
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const matches = noSpaces.match(emojiRegex);
  return matches ? matches.length : 0;
}

function getRoundedCorners(
  isUserMessage: boolean,
  hasPrevious: boolean,
  hasNext: boolean
): string {
  if (isUserMessage) {
    return `rounded-tl-3xl rounded-bl-3xl ${
      hasPrevious ? "rounded-tr-sm" : "rounded-tr-3xl"
    } ${hasNext ? "rounded-br-sm" : "rounded-br-3xl"}`;
  } else {
    return `rounded-tr-3xl rounded-br-3xl ${
      hasPrevious ? "rounded-tl-sm" : "rounded-tl-3xl"
    } ${hasNext ? "rounded-bl-sm" : "rounded-bl-3xl"}`;
  }
}

export interface MessageBubbleProps {
  message: any;
  user: User;
  hovered: boolean;
  reply: () => void;
  onReact: (emoji: string | null) => void;
  onOpenEmojiMenu: () => void;
  onResendMessage: (message: Message) => void;
  animate?: boolean;
  theme?: ChatTheme;
  advertisementMessageId?: string | null;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function MessageBubble({
  message,
  user,
  hovered,
  reply,
  animate = false,
  onOpenEmojiMenu,
  onResendMessage,
  theme = DEFAULT_THEME,
  advertisementMessageId,
  onLinkClick,
  onReact,
}: MessageBubbleProps) {
  const isUserMessage = message.sender === user.id;
  const roundedCorners = getRoundedCorners(
    isUserMessage,
    message.hasPrevious,
    message.hasNext
  );
  const sending = message.status === "sending";
  const error = message.status === "error";
  const edited = message.edited ?? false;

  const messageContent = message.content;
  const isLargeEmojiMessage =
    isOnlyEmojis(messageContent) && countEmojis(messageContent) <= 3;

  const x = useMotionValue(0);
  const replyIconScale = useTransform(
    x,
    !isUserMessage ? [0, 30, 40, 50] : [0, -30, -40, -50],
    [0, 0.5, 0.8, 1]
  );

  const handlePan = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isUserMessage && info.offset.x > 0) return; // Only allow right swipe for "me" messages
    if (!isUserMessage && info.offset.x < 0) return; // Only allow left swipe for "other" messages

    if (document.querySelector("#emoji-overlay-main")) {
      x.set(0);
      if (event instanceof TouchEvent) {
        const touchEvent = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
          composed: true,
          touches: [event.touches[0] as Touch],
        });
        document?.dispatchEvent(touchEvent);
      }
      return;
    }

    x.set(info.offset.x);
  };

  const handlePanEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50;

    if (
      (isUserMessage && info.offset.x < -threshold) ||
      (!isUserMessage && info.offset.x > threshold)
    ) {
      if (!document.querySelector("#emoji-overlay-main")) {
        reply();
      }
    }

    x.set(0);
  };

  const longPressHandler = useLongPressHack<HTMLDivElement>((event) => {
    if (message.type === "deleted") return;

    onOpenEmojiMenu();

    let touchEvent = new TouchEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    event.target.dispatchEvent(touchEvent);
  });

  return (
    <div
      key={message.id}
      className={`relative flex w-full items-center ${
        isUserMessage ? "justify-end" : "justify-start"
      }`}
    >
      <motion.div
        className={cn(
          "absolute p-2.5 rounded-full",
          isUserMessage ? "right-0" : "left-0"
        )}
        style={{
          background: `${theme.accentColor}15`, // Apply opacity to background
          scale: replyIconScale,
        }}
      >
        <Reply
          className={cn("w-4 h-4")}
          style={{
            color: theme.accentColor,
          }}
        />
      </motion.div>

      {!error && isUserMessage && (
        <p
          className={`opacity-50 text-[0.70rem] self-end pr-2 pb-2 overflow-clip -mr-[80px] ${
            advertisementMessageId === message.id && !hovered
              ? "visible"
              : "invisible"
          }`}
          style={{
            color: getTextColor(theme.chatBackground),
          }}
        >
          AnimoChat.com
        </p>
      )}

      {isUserMessage && (
        <ActionIcons
          isUserMessage={message.sender === user.id}
          visible={hovered}
          theme={theme}
          reply={reply}
          onOpenEmojiMenu={onOpenEmojiMenu}
          isDeleted={message.type === "deleted"}
        />
      )}

      {/* display error text */}
      {error && isUserMessage && (
        <p
          className={`opacity-50 text-[0.70rem] self-end pr-2 pb-2 overflow-clip text-red-800`}
        >
          Error sending message.{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => onResendMessage(message)}
          >
            Retry
          </span>
        </p>
      )}

      <motion.div
        key={message.id + "-bubble"}
        id="message-bubble"
        dragSnapToOrigin
        dragTransition={{
          bounceDamping: 13,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handlePan}
        onDragEnd={handlePanEnd}
        whileTap={{
          scale: 0.8,
        }}
        style={{
          x,
          originX: isUserMessage ? 1 : 0,
          WebkitTapHighlightColor: "transparent",
        }}
        onDoubleClick={() => {
          onReact("❤️");
        }}
        {...(message.type !== "deleted" && {
          onContextMenu: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenEmojiMenu();
          },
        })}
        {...longPressHandler}
        initial={
          animate
            ? {
                scale: 0,
                opacity: 0,
              }
            : false
        }
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          duration: 0.4,
        }}
        className={`max-w-[75%] mb-0.5 flex flex-col ${
          isUserMessage ? "items-end" : "items-start"
        } ${sending ? "opacity-50" : ""}`}
      >
        {edited && <p className="text-[0.70rem] px-2 text-gray-500">Edited</p>}

        {message.replyingTo && (
          <ReplyIndicator
            message={message.replyingTo}
            isUserMessage={isUserMessage}
            theme={theme}
          />
        )}

        {(message.type === null ||
          message.type === undefined ||
          message.type === "text" ||
          message.type === "deleted") && (
          <TextMessage
            isLargeEmojiMessage={isLargeEmojiMessage}
            message={message}
            user={user}
            theme={theme}
            isUserMessage={isUserMessage}
            roundedCorners={roundedCorners}
            onLinkClick={onLinkClick}
          />
        )}

        {message.type === "image" && (
          <BlurredImageMessage
            user={user}
            message={message}
            roundedCorners={roundedCorners}
            isUserMessage={isUserMessage}
            theme={theme}
          />
        )}
      </motion.div>
      {!isUserMessage && (
        <ActionIcons
          visible={hovered}
          theme={theme}
          isUserMessage={false}
          reply={reply}
          onOpenEmojiMenu={onOpenEmojiMenu}
        />
      )}
      {!isUserMessage && (
        <p
          className={`opacity-50 text-[0.70rem] self-end pl-2 pb-2 -ml-[70px] ${
            advertisementMessageId === message.id && !hovered
              ? "visible"
              : "invisible"
          }`}
          style={{
            color: getTextColor(theme.chatBackground),
          }}
        >
          AnimoChat.com
        </p>
      )}
    </div>
  );
}

function BlurredImageMessage({
  user,
  message,
  roundedCorners,
  isUserMessage,
  theme,
}: {
  user: User;
  message: Message;
  roundedCorners: string;
  isUserMessage: boolean;
  theme: ChatTheme;
}) {
  const [clicked, setClicked] = useState(false);
  const combinedRounded = `rounded-3xl ${roundedCorners} ${
    isUserMessage ? "rounded-tr-3xl" : "rounded-tl-3xl"
  }`;

  return (
    <div
      id="image-message-container"
      onClick={() => setClicked(true)}
      style={{ cursor: "pointer" }}
    >
      {/* Wrap the image inside a container with the desired outline */}
      <div
        className={combinedRounded}
        style={{
          overflow: "hidden",
          position: "relative",
          // Provide an outline that remains sharp
          border: "2px solid transparent",
        }}
      >
        <PhotoView src={message.content} key={message.id}>
          <Image
            width={
              typeof window !== "undefined"
                ? Math.min(window.innerWidth * 0.6, 300)
                : 200
            }
            height={
              typeof window !== "undefined"
                ? Math.min(window.innerWidth * 0.6, 300)
                : 200
            }
            className={combinedRounded}
            src={message.content}
            alt="Image"
            style={{
              filter: clicked ? "none" : "blur(8px)",
              transition: "filter 0.3s ease-in-out",
              maxWidth: "100%",
              objectFit: "contain",
              backgroundColor: theme.chatBackground,
            }}
            sizes="(max-width: 768px) 70vw, 400px"
          />
        </PhotoView>
        {!clicked && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: theme.userTextColor,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              padding: "4px 8px",
              borderRadius: "0.25rem",
              pointerEvents: "none",
              fontSize: "0.85rem",
            }}
          >
            (tap to reveal)
          </div>
        )}
      </div>
      <ReactionBubble message={message} user={user} theme={theme} />
    </div>
  );
}

function TextMessage({
  message,
  user,
  theme,
  isUserMessage,
  roundedCorners,
  isLargeEmojiMessage,
  onLinkClick,
}: {
  message: Message;
  user: User;
  theme: ChatTheme;
  isUserMessage: boolean;
  roundedCorners: string;
  isLargeEmojiMessage: boolean;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}) {
  const isDeleted = message.type === "deleted";

  return (
    <>
      {isLargeEmojiMessage ? (
        <>
          <div className="px-2 py-2">
            <p className="text-5xl">{message.content}</p>
            <div className="mt-4">
              <ReactionBubble message={message} user={user} theme={theme} />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          <div className="relative group">
            <div
              className={`${roundedCorners} animate-gradient-x`}
              style={{
                background: isUserMessage
                  ? theme.userBubbleGradient
                  : theme.otherBubbleGradient,
                backgroundSize: "200% 100%",
                color: isUserMessage
                  ? theme.userTextColor
                  : theme.otherTextColor,
              }}
            />
            <div
              className={`${roundedCorners} relative max-w-full break-words px-3 py-2 ${
                (!isUserMessage && theme.otherAnimated) ||
                (isUserMessage && theme.userAnimated)
                  ? "bg-white opacity-70"
                  : ""
              }`}
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                color: isUserMessage
                  ? theme.userTextColor
                  : theme.otherTextColor,
              }}
            >
              <p className="break-words whitespace-pre-wrap">
                <Linkify
                  options={{
                    attributes: {
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "underline",
                    },
                    render: ({ attributes, content }) => (
                      <a
                        {...attributes}
                        onClick={(e) => {
                          if (onLinkClick) {
                            onLinkClick(e);
                          } else {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {content}
                      </a>
                    ),
                  }}
                >
                  {isDeleted ? (
                    // italicize the deleted message (Message has been deleted.)
                    <span className="italic">Message has been deleted.</span>
                  ) : (
                    message.content
                  )}
                </Linkify>
              </p>
            </div>
          </div>
          <ReactionBubble message={message} user={user} theme={theme} />
        </div>
      )}
    </>
  );
}
