import { AnimatePresence, motion } from "motion/react";
import EmojiMenu from "./emoji-menu";
import ContextMenu from "./context-menu";
import { DEFAULT_THEME, Message, User, UserMessage } from "@/src/lib/types";
import { defaultTheme } from "@/src/lib/default-chat-themes";

interface EmojiOverlayProps {
  open: boolean;
  message: UserMessage;
  messageDiv: HTMLDivElement;
  user: User;
  onReact: (messageId: string, reaction: string | null) => Promise<void>;
  onEdit: (messageId: string) => void;
  onCopy: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onClose: () => void;
}

export const EmojiOverlay: React.FC<EmojiOverlayProps> = ({
  open,
  message,
  messageDiv,
  user,
  onReact,
  onClose,
  onCopy,
  onEdit,
  onReply,
  onDelete,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div
          key="emoji-overlay-main"
          id="emoji-overlay-main"
          className="overflow-visible absolute left-0 top-0 select-none"
        >
          <motion.div
            key="emoji-overlay"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-30"
            onClick={onClose}
          />
          <div key="context-container" className="relative z-40 w-full">
            <EmojiMenu
              key="emoji-menu"
              isUserMessage={message.sender === user.id}
              preselectedEmoji={
                message.reactions?.find((r: any) => r.user_id === user.id)
                  ?.emoji != null
                  ? {
                      emoji: message.reactions?.find(
                        (r: any) => r.user_id === user.id
                      )?.emoji!,
                    }
                  : undefined
              }
              messageDiv={messageDiv}
              message={message}
              onReact={onReact}
              onClose={onClose}
            />

            <ContextMenu
              onCopy={() => onCopy(message.id)}
              onEdit={() => onEdit(message.id)}
              onReply={() => onReply(message.id)}
              onDelete={() => onDelete(message.id)}
              onClose={onClose}
              key="context-menu"
              theme={defaultTheme}
              mode={"light"}
              anchor={messageDiv}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
