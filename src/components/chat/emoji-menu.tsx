"use client";


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
  // Ref for the emoji container so we can measure its dimensions if needed
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  // State to hold the computed position
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // Use layout effect to measure before paint
  useLayoutEffect(() => {
    // get div with id "message-bubble"
    const messageBubble = messageDiv.querySelector(
      "#message-bubble"
    )! as HTMLDivElement;

    messageBubble.style.position = "relative";
    messageBubble.style.zIndex = "30";

    if (messageBubble && emojiContainerRef.current) {
      const bubbleRect = messageBubble.getBoundingClientRect();
      const container = emojiContainerRef.current;
      // Optionally measure container dimensions
      const containerHeight = container.offsetHeight;

      // position at the top and left of the message bubble
      // accounting for scroll position
      let top = bubbleRect.top;

      // add window scroll
      top += window.scrollY;

      // currently, the top is set to the top of the message bubble
      // so it will be right above the message bubble
      // adjust it to be at the top of the message bubble
      top -= containerHeight + 10;

      // top = Math.max(top, -containerHeight * 4);

      // centered horizontally on the window
      let left = bubbleRect.right - container.offsetWidth - 16;
      const isUserMessage = messageBubble.classList.contains("items-end");
      if (!isUserMessage) {
        // if the message is from the user, then move the emoji container to the left
        // so it is right next to the message bubble
        left = bubbleRect.left - 16;
      }
      setPosition({ top, left });
    }

    return () => {
      // messageBubble.style.position = "static";
      messageBubble.style.zIndex = "0";
    };
  }, [messageDiv]);

  useEffect(() => {
    // Global listener to “capture” pointer moves after the long press
    const handlePointerMove = (event: PointerEvent) => {
      // Check if our emoji container is mounted
      if (!emojiContainerRef.current) return;
      // Find the element at the pointer coordinates
      const targetElem = document.elementFromPoint(
        event.clientX,
        event.clientY
      );
      if (targetElem) {
        // Look for an emoji element (make sure each emoji element has a data attribute, e.g., data-emoji)
        const emojiElem = targetElem.closest("[data-emoji]");
        if (emojiElem) {
          const emoji = emojiElem.getAttribute("data-emoji");
          setHoveredEmoji(emoji);
          return;
        }
      }
      setHoveredEmoji(null);
    };

    const handlePointerUp = (event: PointerEvent) => {
        console.log("Pointer up event:", event);

      if (hoveredEmoji) {
        onReact(
          message.id,
          preselectedEmoji?.emoji === hoveredEmoji ? null : hoveredEmoji
        );

        onClose();
      }
    };

    // Listen at the window level so that even if the pointer isn’t directly over our container
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [hoveredEmoji, onReact, onClose, preselectedEmoji, message.id]);

  useEffect(() => {
    if (emojiContainerRef.current) {
      // Dispatch a synthetic pointerdown event to “capture” events on this element.
      const pointerDownEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
      });
      emojiContainerRef.current.dispatchEvent(pointerDownEvent);
      // You could also call containerRef.current.setPointerCapture(event.pointerId)
      // if you had access to the pointerId (but that typically comes during an actual pointerdown).
    }
  }, []);

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
                //   onClick={() => {
                //     onReact(
                //       message.id,
                //       preselectedEmoji?.emoji === emoji ? null : emoji
                //     );
                //     onClose();
                //   }}
                  data-emoji={emoji}
                  animate={{ scale: hoveredEmoji === emoji ? 1.6 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span className="text-xl">{emoji}</span>

                  {/* Selected indicator dot */}
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
