"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageSquarePlus, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence, Variants, delay } from "framer-motion"; // Import motion and AnimatePresence
import { AnimateChangeInHeight } from "../lib/animate-height-change";
import { PopularInterest } from "../lib/types";
import { FeedbackDialog } from "./feedback-dialog";
import { LoadingSpinner } from "./loading-spinner";



// --- PROPS INTERFACE ---
interface InterestSelectorProps {
  interests: Set<string>;
  onInterestsChange: (newInterests: Set<string>) => void;
  onFindMatch: (interests: Set<string>) => void;
  isConnecting: boolean; // Prop to indicate loading/connecting state
  status: string; // Prop to display the current status message
}

// --- CHILD COMPONENT: InterestTag ---
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
          placeholder="Match randomly or add an interest"
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
