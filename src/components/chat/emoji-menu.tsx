import { Message } from "@/src/lib/types";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const REACTION_EMOJIS = ["❤️", "😆", "😮", "😢", "😭", "😡", "👍"];

interface EmojiMenuProps {
  isUserMessage: boolean;
  preselectedEmoji?: { emoji: string };
  message: Message;
  messageDiv: HTMLDivElement;
  onReact: (messageId: string, emoji: string | null) => void;
  onClose: () => void;
}

export default function EmojiMenu({
  isUserMessage,
  preselectedEmoji,
  message,
  messageDiv,
  onReact,
  onClose,
}: EmojiMenuProps) {
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // For tracking pointer interaction
  const activePointerIdRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const messageBubble = messageDiv.querySelector(
      "#message-bubble"
    )! as HTMLDivElement;
    messageBubble.style.position = "relative";
    messageBubble.style.zIndex = "30";

    if (messageBubble && emojiContainerRef.current) {
      const bubbleRect = messageBubble.getBoundingClientRect();
      const container = emojiContainerRef.current;
      const containerHeight = container.offsetHeight;
      let top = bubbleRect.top + window.scrollY - containerHeight - 10;
      let left = bubbleRect.right - container.offsetWidth - 16;
      const isUser = messageBubble.classList.contains("items-end");
      if (!isUser) {
        left = bubbleRect.left - 16;
      }
      setPosition({ top, left });
    }

    return () => {
      messageBubble.style.zIndex = "0";
    };
  }, [messageDiv]);

  useEffect(() => {
    const container = emojiContainerRef.current;
    if (!container) return;

    // pointerdown on container: begin capturing
    const handlePointerDown = (e: PointerEvent) => {
      // Only proceed for primary button / touch
      if (e.button !== 0) return;
      // Capture this pointer so we continue getting move/up
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // some browsers may throw if not on the same element; but we are on container
      }
      activePointerIdRef.current = e.pointerId;

      // Optionally, immediately check hovered emoji at down:
      const targetElem = document.elementFromPoint(e.clientX, e.clientY);
      if (targetElem) {
        const emojiElem = targetElem.closest("[data-emoji]");
        if (emojiElem) {
          const emoji = emojiElem.getAttribute("data-emoji");
          setHoveredEmoji(emoji);
          return;
        }
      }
      setHoveredEmoji(null);
    };

    // pointermove: update hoveredEmoji
    const handlePointerMove = (e: PointerEvent) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      if (!container) return;
      const targetElem = document.elementFromPoint(e.clientX, e.clientY);
      if (targetElem) {
        const emojiElem = targetElem.closest("[data-emoji]");
        if (emojiElem) {
          const emoji = emojiElem.getAttribute("data-emoji");
          setHoveredEmoji(emoji);
          return;
        }
      }
      setHoveredEmoji(null);
    };

    // pointerup: finalize selection if pointerId matches
    const handlePointerUp = (e: PointerEvent) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      // On pointerup, if hoveredEmoji is non-null, we select it
      if (hoveredEmoji) {
        const chosen = hoveredEmoji;
        // If same as preselected, toggle off
        const reactEmoji =
          preselectedEmoji?.emoji === chosen ? null : chosen;
        onReact(message.id, reactEmoji);
      }
      onClose();
      // release capture
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerIdRef.current = null;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [hoveredEmoji, onReact, onClose, preselectedEmoji, message.id]);

  // Remove the synthetic pointerdown dispatch in your original code; now we rely on the real pointerdown
  // useEffect(() => { ... synthetic dispatch removed ... }, []);

  return (
    <motion.div
      key="emoji-menu"
      layout
      className="absolute top-0 left-0 w-screen h-screen"
      initial={{
        userSelect: "none",
        zIndex: 100,
        opacity: 0,
        height: 0,
      }}
      animate={{
        opacity: 1,
        height: "auto",
      }}
      exit={{
        opacity: 0,
        height: 0,
      }}
    >
      <div
        id="emoji-abs-container"
        className={`absolute border-box flex z-50 w-full md:w-fit px-4`}
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
        }}
      >
        <motion.div
          ref={emojiContainerRef}
          id="emoji-container-wrapper"
          className="w-full backdrop-blur-md bg-gray-100 py-2 px-5 dark:bg-gray-800/80 shadow-lg rounded-full border border-gray-200 dark:border-gray-700"
          initial={{
            scale: 0.8,
            opacity: 0,
            y: 10,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 20,
            },
          }}
          exit={{
            scale: 0.8,
            opacity: 0,
            y: 10,
            transition: {
              duration: 0.15,
            },
          }}
        >
          <div id="emoji-container" className="flex justify-between">
            <AnimatePresence>
              {REACTION_EMOJIS.map((emoji) => (
                <motion.div
                  key={emoji}
                  className={`relative z-10 cursor-pointer rounded-full p-2 ${
                    preselectedEmoji?.emoji === emoji
                      ? "bg-gray-200/80 dark:bg-gray-700/80"
                      : hoveredEmoji === emoji
                      ? "bg-gray-100/80 dark:bg-gray-600/80"
                      : ""
                  }`}
                  // Remove onClick entirely
                  data-emoji={emoji}
                  animate={{ scale: hoveredEmoji === emoji ? 1.6 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span className="text-xl">{emoji}</span>
                  {preselectedEmoji?.emoji === emoji && (
                    <motion.div
                      className="absolute -bottom-0.5 left-1/2 w-1 h-1 bg-green-500 rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layoutId="selectedDot"
                      style={{ translateX: "-50%" }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
