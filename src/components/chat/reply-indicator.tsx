import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { Message } from "@/src/lib/types"; // Assuming types are in this path
import { LucideReply, Reply } from "lucide-react";
import Image from "next/image";

/*
This component expects a `theme` prop that matches the `ChatThemeV2` interface, 
which is aligned with the main chat component's theme structure. It also requires a `mode` prop ('light' | 'dark').

This migration uses keys that should exist in your ChatThemeV2 interface, likely under 'overlays'.

Example structure for `ChatThemeV2` additions used here:

interface ColorScheme {
  light: string;
  dark: string;
}

interface ChatThemeV2 {
  // ... other properties from main theme
  overlays: {
    replyingPreview: {
        background: ColorScheme;
        description: ColorScheme;
        // ... other keys
    };
  }
}
*/

/* ReplyIndicator Component */
interface ReplyIndicatorProps {
  replyingMessage: any; 
  message: any,
  isUserMessage: boolean;
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

export default function ReplyIndicator({
  message,
  replyingMessage,
  isUserMessage,
  theme,
  mode,
}: ReplyIndicatorProps) {
  if (!replyingMessage) return null;

  if (replyingMessage.type === "image") {
    return (
      <ReplyIndicatorImage
        message={message}
        replyingMessage={replyingMessage}
        isUserMessage={isUserMessage}
        theme={theme}
        mode={mode}
      />
    );
  }

  let topMessage = `${isUserMessage ? "You replied" : `${message.senderNickname} replied`} to ${replyingMessage.senderNickname}`
  
  return (
    <>
      <div 
        className={`mx-2 flex ${isUserMessage ? "flex-row" : "flex-row-reverse"} items-center`}
        style={{
          color: theme.secondaryText[mode],
        }}
      >
        <Reply width={16} height={16} className="mx-1" />
        <p className="text-xs my-1">{topMessage}</p>
      </div>
      <div
        className="rounded-tl-3xl rounded-tr-3xl rounded-b-3xl px-3 pt-2 text-sm opacity-[0.65] pb-[32px] -mb-[32px] -z-10"
        style={{
          // Re-using the replyingPreview theme keys as they serve a similar purpose
          backgroundColor: theme.overlays.replyingPreview.background[mode],
          color: theme.overlays.replyingPreview.description[mode],
        }}
      >
        <p className="break-words whitespace-pre-wrap line-clamp-4">
          {replyingMessage.type === "deleted" ? "Deleted message." : replyingMessage.type === "voice_message" ? "Voice message." : replyingMessage.content}
        </p>
      </div>
    </>
  );
}

function ReplyIndicatorImage({
  message,
  replyingMessage,
  isUserMessage,
  theme,
  mode,
}: ReplyIndicatorProps) {
  // The background for the container can be themed in case the image fails to load or has transparency.
  return (
    <div
      className="pb-[32px] -mb-[32px] rounded-t-lg rounded-b-md overflow-hidden"
      style={{ backgroundColor: theme.general.background[mode] }}
    >
      <Image
        src={replyingMessage.content}
        alt="Reply image"
        className="object-contain"
        width={80}
        height={100}
      />
    </div>
  );
}
