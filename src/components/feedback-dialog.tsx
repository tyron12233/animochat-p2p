import { Button } from "@/components/ui/button";
import { X, MessageSquarePlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { LoadingSpinner } from "./loading-spinner";

export const FeedbackDialog = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      setFeedback("");
      setIsSubmitting(false);
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setSubmitError("Feedback cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(feedback);
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setSubmitError("Failed to submit feedback. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close dialog"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <MessageSquarePlus className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Got a suggestion?
              </h2>
              <p className="text-gray-500 mb-6">
                We'd love to hear your ideas for new features or improvements.
              </p>
            </div>
            {submitSuccess ? (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-700">
                  Thank you! Your feedback has been submitted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="feedback-content" className="sr-only">
                    Your suggestion
                  </label>
                  <textarea
                    id="feedback-content"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your suggestion here..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                {submitError && (
                  <p className="text-red-600 text-sm text-center">
                    {submitError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center"
                >
                  {isSubmitting && <LoadingSpinner />}
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};