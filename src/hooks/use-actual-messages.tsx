
import { useEffect, useState } from "react";
import { Message, UserMessage } from "../lib/types";

// Define the time threshold (e.g., 5 minutes) in milliseconds
const TIME_THRESHOLD_MS = 5 * 60 * 1000;

export function useActualMessages(messages: Message[]): Message[] {
  const [actualMessages, setActualMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setActualMessages([]);
      return;
    }

    let lastShownTimestamp: number | null = null;
    let processedMessages: any[] = []; // Use a more specific type if available that includes the new properties

    // --- Pass 1: Calculate initial properties including the corrected showTime ---
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const currentTimestamp = new Date(message.created_at!).getTime();
      let showTime = false;

      // Check if it's a valid timestamp before proceeding
      if (!isNaN(currentTimestamp)) {
        // Determine if time should be shown for this message
        // Show time if it's the first message considered OR enough time has passed since the last shown time.
        // Crucially, only *non-system/typing/filler* messages should potentially trigger a timestamp display.
        if (
          message.sender !== "system" &&
          message.id !== "typing" &&
          message.id !== "filler"
        ) {
          if (
            lastShownTimestamp === null ||
            currentTimestamp - lastShownTimestamp > TIME_THRESHOLD_MS
          ) {
            showTime = true;
            lastShownTimestamp = currentTimestamp; // Update the last shown time *only* when we decide to show it
          }
        }
      } else {
         console.warn("Invalid date encountered for message:", message.id); // Log invalid dates
      }

      processedMessages.push({
        ...message,
        // Assign calculated showTime. Keep original created_at!
        showTime: showTime,
        // Initialize grouping properties - will be refined in the next pass
        hasPrevious: false,
        hasNext: false,
      });
    }



    // resolve replies to messages
    processedMessages = processedMessages.map((message) => {
      const replyingTo = message.replyingTo;
      if (replyingTo && typeof replyingTo === "string") {
        // Find the original message that this one is replying to
        const originalMessage = processedMessages.find(
          (msg) => msg.id === replyingTo
        );
        if (originalMessage) {
          return {
            ...message,
            replyingTo: originalMessage, // Replace string ID with the actual message object
          };
        }
      }

      return message; // Return the message unchanged if no valid reply found
    });


    // --- Pass 2: Refine grouping (hasPrevious/hasNext) based on sender, showTime, reactions, replies ---
    // We need a loop here (not map) to easily modify properties of adjacent elements (like previous.hasNext)
    for (let i = 0; i < processedMessages.length; i++) {
        const current = processedMessages[i];
        const previous = processedMessages[i - 1];
        const next = processedMessages[i + 1];

        if (!current) continue; // Skip if current is undefined

        // 1. Initial grouping based on sender continuity
        current.hasPrevious = !!previous && previous.sender === current.sender;
        current.hasNext = !!next && next.sender === current.sender;
        
        // let showName = current.hasPrevious && previous.sender !== current.sender;
        current.showName = previous && previous.sender !== current.sender;

        // --- Adjust grouping based on various break conditions ---

        // 2. Time Break: If current message shows time, it breaks the chain from the previous message.
        if (current.showTime && previous) {
            current.hasPrevious = false;
            previous.hasNext = false; // Modify the actual previous message object
        }

        // 3. Reaction Break: If current has reactions, it shouldn't visually connect to the next.
        if (current.reactions && current.reactions.length > 0 && next) {
            current.hasNext = false;
            // Also ensure the next message doesn't think it has a preceding message from the same sender in this group
             if (next.sender === current.sender) {
                 next.hasPrevious = false;
             }
        }

        // 4. Reply Break (Previous): If current is a reply, break connection with the previous message.
        if (current.replyingTo && previous) {
            current.hasPrevious = false;
             if (previous.sender === current.sender) {
                previous.hasNext = false;
             }
        }

        // 5. Reply Break (Next): If current is a reply, break connection with the next message.
         if (current.replyingTo && next) {
            current.hasNext = false;
             if (next.sender === current.sender) {
                 next.hasPrevious = false;
             }
        }

        // if the previous message is reply, it should not be connected to the current message
        if (previous && previous.replyingTo) {
            current.hasPrevious = false;
            previous.hasNext = false; // Modify the actual previous message object
        }

        // 6. System/Typing Break: If the *next* message is system or typing, the current message shouldn't link forward.
        // (This prevents chaining a user message visually into a system message).
        let effectiveNext = processedMessages[i + 1];
        if (effectiveNext && (effectiveNext.sender === "system" || effectiveNext.id === "typing" || effectiveNext.id === "filler")) {
             current.hasNext = false;
             // We don't necessarily need to set effectiveNext.hasPrevious = false here,
             // as system/typing messages might have different styling anyway.
        }
    }


    // --- Pass 3: Final adjustments - Move "typing", remove duplicates ---

    // Find and remove the "typing" message temporarily
    let typingMessage: Message | null = null; // Use the extended type if available
    const typingMessageIndex = processedMessages.findIndex(
      (message) => message.id === "typing"
    );
    if (typingMessageIndex !== -1) {
      typingMessage = processedMessages.splice(typingMessageIndex, 1)[0];
    }

    // Remove duplicate messages based on ID, keeping the first occurrence
    const uniqueIds = new Set<string>();
    const uniqueMessages = processedMessages.filter((message) => {
      if (uniqueIds.has(message.id)) {
        return false; // Skip duplicates
      }
      uniqueIds.add(message.id);
      return true; // Keep unique messages
    });

    // Add the "typing" message back to the end if it existed
    if (typingMessage) {
      uniqueMessages.push(typingMessage);
    }

    // Update the state with the fully processed messages
    setActualMessages(uniqueMessages);

  }, [messages]); // Re-run effect only when the input 'messages' array changes

  return actualMessages;
}