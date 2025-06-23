import { ChatTheme } from "@/src/lib/types";
import Image from "next/image";

/* ReplyIndicator Component */
interface ReplyIndicatorProps {
  message: any;
  isUserMessage: boolean;
  theme: ChatTheme;
}

export default function ReplyIndicator({
  message,
  isUserMessage,
  theme,
}: ReplyIndicatorProps) {
  if (!message) return null;

  if (message.type === "image") {
    return (
      <ReplyIndicatorImage
        message={message}
        isUserMessage={isUserMessage}
        theme={theme}
      />
    );
  }
  return (
    <>
      <div
        className="rounded-tl-3xl rounded-tr-3xl rounded-b-3xl px-3 pt-2 text-sm opacity-[0.65] pb-[32px] -mb-[32px] -z-20"
        style={{
          background: isUserMessage
            ? theme.userBubbleGradient
            : theme.otherBubbleGradient,
          color: isUserMessage ? theme.userTextColor : theme.otherTextColor,
        }}
      >
        <p className="break-words whitespace-pre-wrap">

          {message.type === "deleted" ? (
            "Deleted message."
          ) : (
            message.content
          )}
        </p>
      </div>
    </>
  );
}

function ReplyIndicatorImage({
  message,
  isUserMessage,
  theme,
}: ReplyIndicatorProps) {
  // background is image
  return (
    <div className="pb-[32px] -mb-[32px] rounded-tl-3xl rounded-tr-3xl rounded-b-3xl">
      <Image
        src={message.content}
        alt="image"
        className="rounded-tl-3xl rounded-tr-3xl rounded-b-3xl object-contain mb-1"
        width={80}
        height={100}
      />
    </div>
  );
}
