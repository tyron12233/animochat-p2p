
import { motion } from "motion/react";
import { Copy, Delete, Edit, Reply, Trash } from "lucide-react";
import { createRef, useLayoutEffect, useState, useEffect, useRef } from "react";
import { ChatThemeV2 } from "@/src/lib/chat-theme";

interface ContextMenuProps {
  theme: ChatThemeV2;
  mode: "light" | "dark";
  anchor: HTMLDivElement;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}

export default function ContextMenu({
  theme,
  mode,
  anchor,
  onReply,
  onCopy,
  onEdit,
  onClose,
  onDelete
}: ContextMenuProps) {
  const messageBuble = anchor.querySelector("#message-bubble")!;
  const isUserMessage = messageBuble.classList.contains("items-end");
  
  // if the message bubble contains a div with the id "image-message-container", then it is an image message
  const isImageMessage = messageBuble.querySelector(
    "#image-message-container"
  ) !== null;

  const items = [
    { icon: <Reply className="h-4 w-4" />, text: "Reply", onClick: onReply },
    { icon: <Copy className="h-4 w-4" />, text: "Copy", onClick: onCopy },
    ...(isUserMessage && !isImageMessage
      ? [{ icon: <Edit className="h-4 w-4" />, text: "Edit", onClick: onEdit }]
      : []),

      // delete message is isUserMessage
    ...(isUserMessage
      ? [{ icon: <Trash className="h-4 w-4" />, text: "Delete", onClick: onDelete }]
      : []),
  ];

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  const contextMenuRef = createRef<HTMLDivElement>();

  // Update the ref so we can always get the latest activeIndex in our pointerup handler
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useLayoutEffect(() => {
    if (!anchor || !contextMenuRef.current) return;
    const messageBuble = anchor.querySelector("#message-bubble")!;
    const chatContainer = document.querySelector("#chat-container")!;

    const rect = messageBuble.getBoundingClientRect();
    const contextRect = contextMenuRef.current.getBoundingClientRect();

    let top = rect.bottom + 10;
    // If the context menu overflows the chat container, position it above the message bubble
    if (top + contextRect.height > chatContainer.clientHeight / 2) {
      top = rect.top - contextRect.height - 10;

      // Adjust emoji container if necessary
      const emojiContainer = document.querySelector(
        "#emoji-abs-container"
      ) as HTMLDivElement;
      if (emojiContainer) {
        emojiContainer.style.top = `${top - contextRect.height}px`;
        top -= emojiContainer.offsetHeight + 24;
      }
    }

    top += window.scrollY;
    let left = rect.right - contextRect.width - 24;
    if (!isUserMessage) {
      left = rect.left;
    }

    setPosition({ top, left });
  }, [anchor, isUserMessage]);

  // Global pointer move and pointer up listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!contextMenuRef.current) return;
      const buttons = contextMenuRef.current.querySelectorAll("button");
      let foundIndex: number | null = null;
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          foundIndex = index;
        }
      });
      setActiveIndex(foundIndex);
    };

    const handlePointerUp = (_e: PointerEvent) => {
      if (activeIndexRef.current !== null && contextMenuRef.current) {
        const buttons = contextMenuRef.current.querySelectorAll("button");
        const button = buttons[activeIndexRef.current];
        if (button) {
          // Trigger the click event on the highlighted item
          button.click();
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // Dispatch pointerdown event on mount to capture events
    const pointerDownEvent = new PointerEvent("pointerdown", { bubbles: true });
    window.dispatchEvent(pointerDownEvent);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <motion.div
      ref={contextMenuRef}
      id="context-menu"
      className="absolute flex flex-col rounded-3xl w-[200px] overflow-clip"
      style={{
        background:
          theme.general.background[mode] || "linear-gradient(180deg, #ffffff, #ffffff)",
        top: position.top,
        left: position.left,
      }}
      initial={{
        opacity: 0,
        scale: 0.9,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.9,
        transition: {
          duration: 0.15,
        },
      }}
    >
      {items.map((item, index) => (
        <ContextItem
          key={index}
          icon={item.icon}
          text={item.text}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          active={activeIndex === index}
        />
      ))}
    </motion.div>
  );
}

interface ContextItemProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  active: boolean;
}

function ContextItem({ icon, text, onClick, active }: ContextItemProps) {
  return (
    <div>
      <button
        onClick={onClick}
        className={`flex items-center justify-start w-full px-6 py-4 text-sm text-black hover:bg-gray-200 ${
          active ? "bg-gray-200" : ""
        }`}
      >
        <p className="mr-auto">{text}</p>
        {icon}
      </button>
    </div>
  );
}
