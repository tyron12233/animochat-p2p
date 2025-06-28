"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageSquarePlus, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence, Variants, delay } from "framer-motion"; // Import motion and AnimatePresence
import { AnimateChangeInHeight } from "../lib/animate-height-change";

// Assuming this type is defined in a central types file
export type PopularInterest = {
  interest: string;
  count: number;
};

const UpdatesBox = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-[350px] max-w-full mx-auto mb-2 my-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-blue-800 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
        aria-expanded={isOpen}
        aria-controls="updatesbox-content"
      >
        <span>P2P Chat Development Updates</span>
        <ChevronDown
          size={20}
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <motion.div
          id="updatesbox-content"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="p-4 border-t border-blue-200 text-sm text-blue-900 overflow-hidden"
        >
          <p className="font-semibold">
            First, a huge thank you to everyone who has been using the app and
            participating in our initial testing phase. Your feedback has been
            invaluable as we work to build the best chat experience possible.
          </p>
          <br />

          <p className="mb-3">
            During this test, we used a Peer-to-Peer (P2P) system, where users'
            devices connected directly to each other. We learned that this
            approach wasn't as effective as we'd hoped, as many devices,
            browsers, and network types couldn't form stable connections.
          </p>

          <p>
            Our top priority is a seamless experience for every user. That's why
            we're moving to a new and improved system with a powerful network of
            dedicated chat servers to act as a robust middleman. (While still
            being cost-effective!)
          </p>

          <p>
            This move is a significant step forward in our mission to provide a
            stable, fast, and scalable platform for all of our users. We're
            confident this new architecture will lead to a dramatically better
            chat experience.
          </p>

          <br />
          <p>happy chatting :D -ts</p>
        </motion.div>
      )}
    </div>
  );
};

// --- PROPS INTERFACE ---
interface InterestSelectorProps {
  interests: Set<string>;
  onInterestsChange: (newInterests: Set<string>) => void;
  onFindMatch: (interests: Set<string>) => void;
  isConnecting: boolean; // Prop to indicate loading/connecting state
  status: string; // Prop to display the current status message
}

// --- CHILD COMPONENT: InterestTag ---
// We remove the old `animate-in` class to let framer-motion handle it.
const InterestTag = ({
  text,
  onRemove,
}: {
  text: string;
  onRemove: (text: string) => void;
}) => (
  <div className="tag inline-flex items-center bg-green-600 text-white py-1 px-3 rounded-full m-1 font-medium text-sm transition-all duration-200">
    <span>{text}</span>
    <button
      onClick={() => onRemove(text)}
      className="ml-2 bg-black/10 hover:bg-black/30 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
      aria-label={`Remove ${text}`}
    >
      <X size={14} />
    </button>
  </div>
);

// --- HELPER COMPONENT: LoadingSpinner ---
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

// --- CHILD COMPONENT: FeedbackDialog ---
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

// --- MAIN COMPONENT: InterestSelector ---
export default function InterestSelector({
  interests,
  onInterestsChange,
  onFindMatch,
  isConnecting,
  status,
}: InterestSelectorProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [popularInterests, setPopularInterests] = useState<PopularInterest[]>(
    []
  );
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const API_BASE_URL = "https://animochat-turn-server.onrender.com";

  // Animation variants for staggering the popular topics
  const popularTopicsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.3,
        staggerChildren: 0.07,
        delayChildren: 0.2,
      },
    },
  } as Variants;

  const popularTopicItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  useEffect(() => {
    const fetchPopularInterests = async () => {
      setIsLoadingTopics(true);
      try {
        const response = await fetch(`${API_BASE_URL}/interests/popular`);
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data: PopularInterest[] = await response.json();
        setPopularInterests(data);
      } catch (e) {
        console.error("Failed to fetch popular interests:", e);
        setError("Could not load topics.");
      } finally {
        setIsLoadingTopics(false);
      }
    };
    fetchPopularInterests();
  }, []);

  const addInterest = (interest: string) => {
    const cleanedInterest = interest.trim().toUpperCase();
    if (cleanedInterest && !interests.has(cleanedInterest)) {
      onInterestsChange(new Set(interests).add(cleanedInterest));
    }
    setCurrentInput("");
  };

  const removeInterest = (interestToRemove: string) => {
    const newInterests = new Set(interests);
    newInterests.delete(interestToRemove);
    onInterestsChange(newInterests);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest(currentInput);
    }
  };

  const handleFindMatch = () => {
    let finalInterests = new Set(interests);
    if (
      currentInput.trim() &&
      !finalInterests.has(currentInput.trim().toUpperCase())
    ) {
      finalInterests = new Set(finalInterests).add(
        currentInput.trim().toUpperCase()
      );
      onInterestsChange(finalInterests);
    }
    onFindMatch(finalInterests);
  };

  const handleFeedbackSubmit = async (content: string) => {
    const { error } = await supabase
      .from("suggestions")
      .insert([{ content: content }]);
    if (error) {
      console.error("Error submitting feedback to Supabase:", error);
      throw error;
    }
  };

  const renderPopularInterests = () => {
    if (isLoadingTopics)
      return <p className="text-sm text-gray-400">Loading topics...</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (popularInterests.length === 0)
      return <p className="text-sm text-gray-400">No active topics.</p>;

    // Each button is now a motion.button with animation variants
    return popularInterests.map(({ interest, count }) => (
      <motion.button
        key={interest}
        variants={popularTopicItemVariants}
        onClick={() => addInterest(interest)}
        className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{interest}</span>
        <span className="bg-green-200 text-green-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
          {count}
        </span>
      </motion.button>
    ));
  };

  return (
    <>
      <div className="w-[350px] max-w-full mx-auto">
        <AnimateChangeInHeight>
          <div className="flex flex-wrap justify-center gap-2 pb-4">
            {/* AnimatePresence will handle the enter/exit of tags */}
            <AnimatePresence>
              {Array.from(interests).map((interest) => (
                <motion.div
                  key={interest}
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    transition: { duration: 0.12 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  <InterestTag text={interest} onRemove={removeInterest} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </AnimateChangeInHeight>
        <Input
          id="interest-input"
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-full py-6 px-6 focus-visible:border-green-500 focus-visible:ring-green-500 ring-offset-1 text-center"
          placeholder="Match randomly or type to add an interest"
          maxLength={26}
        />
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Popular Topics
        </h3>
        {/* This container animates its children when they appear */}
        <AnimateChangeInHeight>
          <motion.div
            className="flex flex-wrap justify-center gap-2 max-w-md mx-auto"
            variants={popularTopicsContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {renderPopularInterests()}
          </motion.div>
        </AnimateChangeInHeight>
      </div>

      <div className="mt-12 w-[350px] max-w-full mx-auto">
        <Button
          onClick={handleFindMatch}
          disabled={
            isConnecting
          }
          className="w-full rounded-full py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-base disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isConnecting ? (
            <>
              <LoadingSpinner />
              {status}
            </>
          ) : (
            "Find Match"
          )}
        </Button>
      </div>

      <UpdatesBox />

      <div className="text-center mt-6">
        <Button
          variant="secondary"
          className="text-gray-500 hover:text-green-600 transition-colors"
          onClick={() => setIsFeedbackDialogOpen(true)}
        >
          <MessageSquarePlus size={16} className="mr-2" />
          We'd love to hear your feedback
        </Button>
      </div>

      <FeedbackDialog
        isOpen={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
}
