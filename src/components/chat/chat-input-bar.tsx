import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal, Mic, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThemeV2 } from "../../lib/chat-theme";
import { Mention, Message, Participant, Status } from "../../lib/types";
import { useState, useRef, useEffect } from "react";

// Helper to format time for the recorder
const formatRecordingTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

interface ChatInputBarProps {
  status: Status;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  onSendMessage: (e: React.FormEvent) => void;
  onSendVoiceMessage: (audioBlob: Blob) => void;
  onSendImageMessage: (base64Image: string) => void; // New prop for sending images
  onStartTyping: () => void;
  groupChat: boolean;
  participants: Participant[];
  bottomMessagePreviewState: {
    type: "editing" | "replying";
    message: Message;
  } | null;
  currentMessage: string;
  currentMentions: Mention[];
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setCurrentMentions: (mentions: Mention[]) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  status,
  theme,
  mode,
  handleInputChange,
  onSendMessage,
  onSendVoiceMessage,
  onSendImageMessage,
  onStartTyping,
  currentMessage,
  bottomMessagePreviewState,
  currentMentions,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setImagePreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreview(null);
    }
  }, [selectedImage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        onSendVoiceMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);

        if (recordingTime >= 15) {
          stopRecording(true);
        }
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = (send: boolean) => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      if (send) {
        mediaRecorderRef.current.stop();
      } else {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecordingTime(0);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

   const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      // Check if the clipboard item is an image
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          // Create a File object from the blob to handle it like a selected file
          const pastedImageFile = new File([blob], "pasted-image.png", { type: blob.type });
          setSelectedImage(pastedImageFile);
        }
        event.preventDefault(); // Prevent the browser's default paste behavior
        break; // We only handle the first image found
      }
    }
  };

  const handleSendImage = () => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          // Compress image using canvas
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Resize if larger than 1024px (optional)
            const maxDim = 1024;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = (height * maxDim) / width;
                width = maxDim;
              } else {
                width = (width * maxDim) / height;
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // JPEG for better compression, quality 0.7
              const compressed = canvas.toDataURL("image/jpeg", 0.7);
              onSendImageMessage(compressed);
              setSelectedImage(null);
            }
          };
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const hasText = currentMessage.trim().length > 0;
  const hasImage = selectedImage !== null;
  const isInputDisabled = status !== "connected";

  return (
    <div
      style={{
        backgroundColor: theme.inputArea.background[mode],
        borderColor: theme.inputArea.border[mode],
      }}
      className="p-4 border-t shrink-0"
    >
      {imagePreview && (
        <div className="mb-2 flex items-center">
          <img
            src={imagePreview}
            alt="Selected"
            className="w-16 h-16 object-cover rounded-md mr-2"
          />
          {selectedImage && (
            <p className="text-sm text-gray-500 flex-grow">
              {selectedImage.name}
            </p>
          )}
          <Button
            onClick={() => setSelectedImage(null)}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Trash2
              size={20}
              style={{ color: theme.inputArea.inputText[mode] }}
            />
          </Button>
        </div>
      )}
      <div className="flex items-center space-x-3">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recorder"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex items-center gap-3"
            >
              <Mic size={20} className="text-red-500 animate-pulse" />
              <span style={{ color: theme.inputArea.inputText[mode] }}>
                {formatRecordingTime(recordingTime)}
              </span>
              <div className="flex-grow" />
              <Button
                onClick={() => stopRecording(false)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Cancel recording"
              >
                <Trash2
                  size={20}
                  style={{ color: theme.inputArea.inputText[mode] }}
                />
              </Button>
              <Button
                onClick={() => stopRecording(true)}
                style={{
                  background: theme.buttons.primary.background[mode],
                  color: theme.buttons.primary.text[mode],
                }}
                className="font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                aria-label="Send voice message"
              >
                <SendHorizonal size={20} />
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="text-input"
              onSubmit={(e) => {
                e.preventDefault();
                if (hasText) {
                  onSendMessage(e);
                }
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-grow flex items-center space-x-3"
            >
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isInputDisabled}
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Send an image"
              >
                <Image
                  size={20}
                  style={{ color: theme.inputArea.inputText[mode] }}
                />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              <input
                onPaste={handlePaste}
                id="chat-input"
                disabled={isInputDisabled}
                type="text"
                value={currentMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                style={{
                  background: theme.inputArea.inputBackground[mode],
                  color: theme.inputArea.inputText[mode],
                  borderColor: theme.inputArea.border[mode],
                }}
                className="text-[16px] flex-grow p-3 border rounded-full"
                autoComplete="off"
              />
                <Button
                id="send-button"
                type={hasText ? "submit" : "button"}
                onClick={
                  !hasText && hasImage
                  ? handleSendImage
                  : !hasText
                  ? startRecording
                  : undefined
                }
                disabled={isInputDisabled}
                style={{
                  background: theme.buttons.primary.background[mode],
                  color: theme.buttons.primary.text[mode],
                  opacity: isInputDisabled ? 0.5 : 1,
                }}
                className="font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                aria-label={
                  hasImage && !hasText
                  ? "andleSendImaged image"
                  : hasText
                  ? "Send message"
                  : "Record voice message"
                }
                >
                <AnimatePresence mode="popLayout">
                  {hasText || hasImage ? (
                  <motion.div
                    key="send"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <SendHorizonal size={20} />
                  </motion.div>
                  ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic size={20} />
                  </motion.div>
                  )}
                </AnimatePresence>
                </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
