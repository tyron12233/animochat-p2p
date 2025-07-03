import { getTextColor } from "@/src/lib/color-utils";
import Linkify from "linkify-react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useLongPress } from "use-long-press";
import ActionIcons from "./action-icons";
import ReplyIndicator from "./reply-indicator";
import ReactionBubble from "./reaction-bubble";
import { Reply } from "lucide-react";
import { useLongPressHack } from "@/src/hooks/use-long-press-hack";
import Image from "next/image";
import { useState } from "react";
import { PhotoView } from "react-photo-view";
import { Mention, Message, User } from "@/src/lib/types"; // Updated to ChatThemeV2
import { ChatThemeV2 } from "@/src/lib/chat-theme";

import "./swipeable-message.css";
/*
This component now expects a `theme` prop that matches the `ChatThemeV2` interface, 
which is aligned with the main chat component's theme structure. It also requires a `mode` prop ('light' | 'dark').

Example structure for `ChatThemeV2` additions used here:

interface ChatThemeV2 {
  // ... other properties from main theme
  message: {
    myMessage: { background: ColorScheme; text: ColorScheme; isAnimated: boolean; };
    strangerMessage: { background: ColorScheme; text: ColorScheme; isAnimated: boolean; };
    deletedMessage: { text: ColorScheme; };
    imageOverlay: { background: ColorScheme; text: ColorScheme; };
    // ...
  };
  accent: {
    main: ColorScheme;
    faded: ColorScheme;
  };
  secondaryText: ColorScheme;
  errorText: ColorScheme;
  linkColor: ColorScheme;
}

*/

function isOnlyEmojis(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  const noSpaces = trimmed.replace(/\s+/g, "");
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const matches = noSpaces.match(emojiRegex);
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
  name: string | null;
  message: any;
  user: User;
  hovered: boolean;
  reply: () => void;
  onReact: (emoji: string | null) => void;
  onOpenEmojiMenu: () => void;
  onResendMessage: (message: Message) => void;
  animate?: boolean;
  theme: ChatThemeV2; // Using the new theme interface
  mode: "light" | "dark"; // Mode is now required
  advertisementMessageId?: string | null;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function MessageBubble({
  name = null,
  message,
  user,
  hovered,
  reply,
  animate = false,
  onOpenEmojiMenu,
  onResendMessage,
  theme,
  mode,
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
    if (
      (isUserMessage && info.offset.x > 0) ||
      (!isUserMessage && info.offset.x < 0)
    )
      return;
    x.set(info.offset.x);
  };

  const handlePanEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (
      (isUserMessage && info.offset.x < -50) ||
      (!isUserMessage && info.offset.x > 50)
    ) {
      reply();
    }
    x.set(0);
  };

  const longPressHandler = useLongPressHack<HTMLDivElement>(() => {
    if (message.type === "deleted") return;
    onOpenEmojiMenu();
  });

  return (
    <div
      key={message.id}
      className={`relative flex w-full items-center ${
        isUserMessage ? "justify-end" : "justify-start"
      }`}
    >
      <motion.div
        className={`absolute p-2.5 rounded-full`}
        style={{
          background: theme.accent.faded[mode],
          scale: replyIconScale,
        }}
      >
        <Reply className="w-4 h-4" style={{ color: theme.accent.main[mode] }} />
      </motion.div>

      {!error && isUserMessage && (
        <p
          className={`opacity-50 text-[0.70rem] self-end pr-2 pb-2 overflow-clip -mr-[80px] ${
            advertisementMessageId === message.id && !hovered
              ? "visible"
              : "invisible"
          }`}
          style={{ color: theme.secondaryText[mode] }}
        >
          AnimoChat.com
        </p>
      )}

      {isUserMessage && (
        <ActionIcons
          isUserMessage={message.sender === user.id}
          visible={hovered}
          theme={theme}
          mode={mode}
          reply={reply}
          onOpenEmojiMenu={onOpenEmojiMenu}
          isDeleted={message.type === "deleted"}
        />
      )}

      {error && isUserMessage && (
        <p
          style={{ color: theme.errorText[mode] }}
          className={`opacity-80 text-[0.70rem] self-end pr-2 pb-2 overflow-clip`}
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
        data-sender-id={message.sender}
        dragSnapToOrigin
        dragTransition={{ bounceDamping: 13 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handlePan}
        onDragEnd={handlePanEnd}
        whileTap={{ scale: 0.8 }}
        style={{
          x,
          originX: isUserMessage ? 1 : 0,
          WebkitTapHighlightColor: "transparent",
        }}
        onDoubleClick={() => onReact("❤️")}
        {...(message.type !== "deleted" && {
          onContextMenu: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenEmojiMenu();
          },
        })}
        {...longPressHandler}
        initial={animate ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
        className={`max-w-[75%] mb-0.5 flex flex-col ${
          isUserMessage ? "items-end" : "items-start"
        } ${sending ? "opacity-50" : ""}`}
      >
        {edited && (
          <p
            className="text-[0.70rem] px-2"
            style={{ color: theme.secondaryText[mode] }}
          >
            Edited
          </p>
        )}
        {name && (
          <p
            className="text-[0.70rem] px-2"
            style={{ color: theme.secondaryText[mode] }}
          >
            {name}
          </p>
        )}

        {message.replyingTo && (
          <ReplyIndicator
            message={message.replyingTo}
            isUserMessage={isUserMessage}
            theme={theme}
            mode={mode}
          />
        )}

        {(message.type === null ||
          message.type === undefined ||
          message.type === "text" ||
          message.type === "deleted") && (
          <TextMessage
            message={message}
            user={user}
            theme={theme}
            mode={mode}
            isUserMessage={isUserMessage}
            roundedCorners={roundedCorners}
            isLargeEmojiMessage={isLargeEmojiMessage}
            onLinkClick={onLinkClick}
          />
        )}

        <ReactionBubble
          message={message}
          user={user}
          theme={theme}
          mode={mode}
        />

        {message.type === "image" && (
          <BlurredImageMessage
            user={user}
            message={message}
            roundedCorners={roundedCorners}
            isUserMessage={isUserMessage}
            theme={theme}
            mode={mode}
          />
        )}
      </motion.div>
      {!isUserMessage && (
        <ActionIcons
          visible={hovered}
          theme={theme}
          mode={mode}
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
          style={{ color: theme.secondaryText[mode] }}
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
  mode,
}: {
  user: User;
  message: Message;
  roundedCorners: string;
  isUserMessage: boolean;
  theme: ChatThemeV2;
  mode: "light" | "dark";
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
      <div
        className={combinedRounded}
        style={{
          overflow: "hidden",
          position: "relative",
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
              backgroundColor: theme.general.background[mode],
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
              color: theme.message.imageOverlay.text[mode],
              backgroundColor: theme.message.imageOverlay.background[mode],
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
      <ReactionBubble message={message} user={user} theme={theme} mode={mode} />
    </div>
  );
}

function AdminCssInjecion({
  className,
  isUserMessage,
  hasNext,
  hasPrevious,
}: {
  className: string;
  isUserMessage: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  function getRoundedCorners(
    isUserMessage: boolean,
    hasPrevious: boolean,
    hasNext: boolean
  ): string {
    const smRadius = "0.25rem";
    const xlRadius = "1.5rem";

    let topLeftRadius: string;
    let topRightRadius: string;
    let bottomLeftRadius: string;
    let bottomRightRadius: string;

    if (isUserMessage) {
      topLeftRadius = xlRadius;
      bottomLeftRadius = xlRadius;
      topRightRadius = hasPrevious ? smRadius : xlRadius;
      bottomRightRadius = hasNext ? smRadius : xlRadius;
    } else {
      topRightRadius = xlRadius;
      bottomRightRadius = xlRadius;
      topLeftRadius = hasPrevious ? smRadius : xlRadius;
      bottomLeftRadius = hasNext ? smRadius : xlRadius;
    }

    return `
    border-top-left-radius: ${topLeftRadius};
    border-top-right-radius: ${topRightRadius};
    border-bottom-left-radius: ${bottomLeftRadius};
    border-bottom-right-radius: ${bottomRightRadius};
  `;
  }

  // sm = 0.25 rem
  // 3xl = 1.5 rem

  return (
    <style>
      {`

.${className} {
    position: relative;
}

@property --angle{
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.${className}::after, .${className}::before {
    content: '';
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: -1;
    ${getRoundedCorners(isUserMessage, hasPrevious, hasNext)}
    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
     animation: 3s spin linear infinite;
}

.${className}::before{
  filter: blur(1.5rem);
  opacity: 0.15;
  overflow: visible;
}

@keyframes spin{
  from{
    --angle: 0deg;
  }
  to{
    --angle: 360deg;
  }
}
`}
    </style>
  );
}

function renderContent(
  sender: string,
  currentUserId: string,
  content: string,
  mentions: Mention[] = [],
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void,
  linkColor?: string
) {
  // Sort so we slice in-order
  const sorted = [...mentions].sort((a, b) => a.startIndex - b.startIndex);
  const parts: React.ReactNode[] = [];
  let last = 0;  

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    // text before this mention
    if (m.startIndex > last) {
      parts.push(
        <Linkify
          key={`text-${i}`}
          options={{
            render: ({ attributes, content }) => (
              <a
                {...attributes}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline", color: linkColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkClick?.(e);
                }}
              >
                {content}
              </a>
            ),
          }}
        >
          {content.slice(last, m.startIndex - 1)}
        </Linkify>
      );
    }

    // the mention itself
    parts.push(
      <a
        key={`mention-${i}`}
        className="font-semibold hover:underline"
        style={{
          // if the mention is the current user, we highlight
            backgroundColor:
            m.id === currentUserId
              ? "rgba(0, 120, 255, 0.2)" // Light highlight for self-mentions
              : "transparent",
            textDecoration: "underline",
          }}
          onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {content.slice(m.startIndex - 1, m.endIndex)}
      </a>
    );

    last = m.endIndex;
  }

  // any trailing text
  if (last < content.length) {
    parts.push(
      <Linkify
        key="text-end"
        options={{
          render: ({ attributes, content }) => (
            <a
              {...attributes}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline", color: linkColor }}
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.(e);
              }}
            >
              {content}
            </a>
          ),
        }}
      >
        {content.slice(last)}
      </Linkify>
    );
  }

  return parts;
}

function TextMessage({
  message,
  user,
  theme,
  mode,
  isUserMessage,
  roundedCorners,
  isLargeEmojiMessage,
  onLinkClick,
}: {
  message: Message;
  user: User;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  isUserMessage: boolean;
  roundedCorners: string;
  isLargeEmojiMessage: boolean;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}) {
  const isDeleted = message.type === "deleted";
  const bubbleTheme = isUserMessage
    ? theme.message.myMessage
    : theme.message.strangerMessage;

  const isAdmin = (message as any)?.role === "admin";
  const className = message.id + "_admin_styles";

  return (
    <>
      {isAdmin && (
        <AdminCssInjecion
          className={className}
          isUserMessage={isUserMessage}
          hasPrevious={(message as any)?.hasPrevious ?? false}
          hasNext={(message as any)?.hasNext ?? false}
        />
      )}

      {isLargeEmojiMessage ? (
        <>
          <div className="px-2 py-2">
            <p className="text-5xl">{message.content}</p>
          </div>
        </>
      ) : (
        <div
          className={`flex flex-col p-[1px] justify-center items-center ${
            isAdmin ? className : ""
          }`}
        >
          <div className="relative group">
            <div
              className={`${roundedCorners} animate-gradient-x`}
              style={{
                background: bubbleTheme.background[mode],
                backgroundSize: "200% 100%",
                color: bubbleTheme.text[mode],
              }}
            />
            <div
              className={`${roundedCorners} relative max-w-full break-words px-3 py-2 ${
                bubbleTheme.isAnimated ? "bg-white opacity-70" : ""
              }`}
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                color: bubbleTheme.text[mode],
              }}
            >
              <p className="break-words whitespace-pre-wrap">
                <Linkify
                  options={{
                    render: ({ attributes, content }) => (
                      <a
                        {...attributes}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "underline",
                          color: theme.linkColor[mode],
                        }}
                        onClick={(e) => {
                          if (onLinkClick) {
                            onLinkClick(e);
                          } else {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {content}
                        {}
                      </a>
                    ),
                  }}
                >
                  {isDeleted ? (
                    <span
                      className="italic"
                      style={{ color: theme.message.deletedMessage.text[mode] }}
                    >
                      Message has been deleted.
                    </span>
                  ) : (
                    <p className="break-words whitespace-pre-wrap">
                      {renderContent(
                        message.sender,
                        user.id,
                        message.content,
                        (message as any).mentions,
                        onLinkClick,
                        theme.linkColor[mode]
                      )}
                    </p>
                  )}
                </Linkify>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
