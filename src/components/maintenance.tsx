import { Button } from "@/components/ui/button";
import { Server } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// --- Placeholder Icons & Components ---
// These are simple placeholders for dependencies in your FeedbackDialog.
// Replace them with your actual icon library (e.g., lucide-react).

const Wrench = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

const X = ({ size = 24, className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const MessageSquarePlus = ({ size = 32, className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"></path>
    <line x1="12" y1="7" x2="12" y2="13"></line>
    <line x1="9" y1="10" x2="15" y2="10"></line>
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Feedback Dialog Component (as provided) ---
const FeedbackDialog = ({
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
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
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
              <p className="text-red-600 text-sm text-center">{submitError}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center transition-colors"
            >
              {isSubmitting && <LoadingSpinner />}
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Maintenance Page Component ---
const MaintenancePage = () => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // A placeholder function for handling feedback submission.
  const handleFeedbackSubmit = async (content: string) => {
    console.log("Submitting feedback:", content);
    // Simulate a network request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // To test error state, you can uncomment the line below:
    // throw new Error("Simulated submission error");
  };

  return (
    <>
      {/* A style block is added for custom, non-utility animations */}
      <style>{`
        @keyframes gentle-wrench-turn {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-wrench {
          animation: gentle-wrench-turn 3s ease-in-out infinite;
        }

        @keyframes progress-bar-shine {
          0% { transform: translateX(-100%) skewX(-30deg); }
          100% { transform: translateX(350%) skewX(-30deg); }
        }
        .progress-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 33%;
          height: 100%;
          background: rgba(255, 255, 255, 0.4);
          animation: progress-bar-shine 2.5s infinite linear;
        }
      `}</style>

      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center text-center p-4 font-sans overflow-hidden">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200">
          {/* The wrench icon now has a custom animation class */}
          <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6 animate-wrench">
            <Wrench className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Under Maintenance
          </h1>

          <p className="text-lg text-gray-600 mb-4">We'll be back up soon!</p>

          <p className="text-md text-gray-500 mb-8">
            We're just polishing things up to make your experience even better.
          </p>

          {/* New animated progress bar */}
          <div className="w-full bg-green-200 rounded-full h-4 mb-8 overflow-hidden relative">
            <div className="bg-green-500 h-4 rounded-full w-3/4 progress-shine"></div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Leave Feedback
            </button>
            <Link href="/status" className="w-full">
              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-green-600"
              >
                <Server className="h-4 w-4 mr-2" />
                Check Service Status
              </Button>
            </Link>
          </div>
        </div>
        <p className="mt-8 text-sm text-gray-400">
          Patience is a virtue, and so is great software!
        </p>
      </div>

      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};

export default MaintenancePage;
