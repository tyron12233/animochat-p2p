 // Assuming types are in this path
import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { Smile, Reply } from "lucide-react";

/*
This component expects a `theme` prop that matches the `ChatThemeV2` interface, 
which is aligned with the main chat component's theme structure. It also requires a `mode` prop ('light' | 'dark').

This migration assumes a new key under `buttons` for styling the action icons.

Example structure for `ChatThemeV2` additions used here:

interface ColorScheme {
  light: string;
  dark: string;
}

interface ChatThemeV2 {
  // ... other properties from main theme
  buttons: {
    // ... other button types
    actionIcon: {
      background: ColorScheme;
      hoverBackground: ColorScheme;
      iconColor: ColorScheme;
    }
  }
  // ... other top-level keys
}
*/


/* ActionIcons Component */
interface ActionIconsProps {
  isUserMessage: boolean;
  reply: () => void;
  onOpenEmojiMenu: () => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  visible: boolean;
  isDeleted?: boolean; // New prop to indicate if message is deleted
}

export default function ActionIcons({
  visible,
  isUserMessage,
  reply,
  onOpenEmojiMenu,
  theme,
  mode,
  isDeleted = false, // Default to false if not provided
}: ActionIconsProps) {
  // Define a base style for the icons to avoid repetition.
  // We assume the theme provides styles for action icons.
  const iconButtonStyle = {
    // For now, we use accent color. A dedicated theme key is better.
    // e.g., theme.buttons.actionIcon.background[mode]
    backgroundColor: 'transparent', 
    color: theme.secondaryText[mode],
  };

  return (
    <div
      key="actions"
      className={`flex flex-row h-full items-center justify-center space-x-1 self-center ${
        visible ? "visible" : "invisible"
      }`}
    >
      <div
        className={`${
          isUserMessage ? "mr-1" : "ml-2"
        } rounded-full transition-colors p-2 cursor-pointer hover:opacity-100 opacity-60`}
        style={iconButtonStyle}
        onClick={reply}
      >
        <Reply className={`w-4 h-4`} strokeWidth="2" />
      </div>

      {/* Only show emoji button if the message is not deleted */}
      {!isDeleted && (
        <div
          className="rounded-full transition-colors p-2 cursor-pointer hover:opacity-100 opacity-60"
          onClick={onOpenEmojiMenu}
          style={iconButtonStyle}
        >
          <Smile
            className={`w-4 h-4`}
            strokeWidth="2"
          />
        </div>
      )}
      {isUserMessage && <div className="w-1"></div>}
    </div>
  );
}
