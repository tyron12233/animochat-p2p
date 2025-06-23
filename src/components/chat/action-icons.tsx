import { ChatTheme } from "@/src/lib/types";
import { SmileIcon } from "lucide-react";

/* ActionIcons Component */
interface ActionIconsProps {
  isUserMessage: boolean;
  reply: () => void;
  onOpenEmojiMenu: () => void;
  theme: ChatTheme;
  visible: boolean;
  isDeleted?: boolean; // New prop to indicate if message is deleted
}

export default function ActionIcons({
  visible,
  isUserMessage,
  reply,
  onOpenEmojiMenu,
  theme,
  isDeleted = false, // Default to false if not provided
}: ActionIconsProps) {
  return (
    <div
      key="actions"
      className={`flex flex-row h-full min-h-full justify-center space-x-1 ${
        visible ? "visible" : "invisible"
      }`}
    >
      <div
        className={`${
          isUserMessage ? "mr-1 mt-1" : "ml-2 mt-1"
        } h-[2rem] rounded-full transition-colors p-2 cursor-pointer hover:opacity-100 opacity-80`}
        style={{
          background: isUserMessage
            ? theme.userBubbleGradient
            : theme.otherBubbleGradient,
          color: !isUserMessage ? theme.otherTextColor : theme.userTextColor,
        }}
        onClick={reply}
      >
        <svg
          className={`w-4 h-4`}
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </div>
      {/* Only show emoji button if the message is not deleted */}
      {!isDeleted && (
        <div
          className="mt-1 h-[2rem] opacity-80 rounded-full transition-colors p-2 cursor-pointer hover:opacity-100"
          onClick={onOpenEmojiMenu}
          style={{
            background: isUserMessage
              ? theme.userBubbleGradient
              : theme.otherBubbleGradient,
          }}
        >
          <SmileIcon
            className={`w-4 h-4`}
            style={{
              color: !isUserMessage
                ? theme.otherTextColor
                : theme.userTextColor,
            }}
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          />
        </div>
      )}
      {isUserMessage && <div className="w-1"></div>}
    </div>
  );
}
