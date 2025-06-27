"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageSquarePlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from "../lib/supabase";

// Assuming this type is defined in a central types file
export type PopularInterest = {
  interest: string;
  count: number;
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
const InterestTag = ({ text, onRemove }: { text: string; onRemove: (text: string) => void }) => (
    <div className="tag inline-flex items-center bg-green-600 text-white py-1 px-3 rounded-full m-1 font-medium text-sm transition-all duration-200 animate-in fade-in-50">
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
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- CHILD COMPONENT: FeedbackDialog ---
const FeedbackDialog = ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (content: string) => Promise<void> }) => {
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when dialog opens
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
            }, 2000); // Close dialog automatically after 2 seconds on success
        } catch (error) {
            setSubmitError("Failed to submit feedback. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // --- MODIFICATION HERE ---
        // Changed `bg-black bg-opacity-60` to `bg-black/60` for a semi-transparent background.
        // Alternative explicit RGBA: `bg-[rgba(0,0,0,0.6)]`
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in-50" aria-modal="true" role="dialog">
            <div ref={dialogRef} tabIndex={-1} className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 relative transform transition-all duration-300 scale-95 animate-in slide-in-from-bottom-10">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close dialog">
                    <X size={24} />
                </button>
                
                <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                        <MessageSquarePlus className="text-green-600" size={32}/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Got a suggestion?</h2>
                    <p className="text-gray-500 mb-6">We'd love to hear your ideas for new features or improvements.</p>
                </div>

                {submitSuccess ? (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-semibold text-green-700">Thank you! Your feedback has been submitted.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="feedback-content" className="sr-only">Your suggestion</label>
                            <textarea
                                id="feedback-content"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Type your suggestion here..."
                                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                required
                            />
                        </div>
                        {submitError && <p className="text-red-600 text-sm text-center">{submitError}</p>}
                        <Button type="submit" disabled={isSubmitting} className="w-full rounded-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center">
                            {isSubmitting && <LoadingSpinner />}
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT: InterestSelector ---
export default function InterestSelector({ interests, onInterestsChange, onFindMatch, isConnecting, status }: InterestSelectorProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [popularInterests, setPopularInterests] = useState<PopularInterest[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const API_BASE_URL = 'https://animochat-turn-server.onrender.com';

  useEffect(() => {
    const fetchPopularInterests = async () => {
        setIsLoadingTopics(true);
        try {
            const response = await fetch(`${API_BASE_URL}/interests/popular`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data: PopularInterest[] = await response.json();
            setPopularInterests(data);
        } catch (e) {
            console.error('Failed to fetch popular interests:', e);
            setError('Could not load topics.');
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
      if (e.key === 'Enter') {
          e.preventDefault();
          addInterest(currentInput);
      }
  };
  
  const handleFindMatch = () => {
    let finalInterests = new Set(interests);
    if (currentInput.trim() && !finalInterests.has(currentInput.trim().toUpperCase())) {
        finalInterests = new Set(finalInterests).add(currentInput.trim().toUpperCase());
        onInterestsChange(finalInterests); // Update parent state immediately
    }
    onFindMatch(finalInterests);
  };
  
  const handleFeedbackSubmit = async (content: string) => {
    const { error } = await supabase
      .from('suggestions')
      .insert([{ content: content }]);

    if (error) {
      console.error('Error submitting feedback to Supabase:', error);
      throw error; // Re-throw to be caught and handled by the dialog component
    }
  };


  const renderPopularInterests = () => {
    if (isLoadingTopics) return <p className="text-sm text-gray-400">Loading topics...</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (popularInterests.length === 0) return <p className="text-sm text-gray-400">No active topics.</p>;
    return popularInterests.map(({ interest, count }) => (
      <button key={interest} onClick={() => addInterest(interest)} className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-green-200 hover:scale-105 transition-all duration-200">
        <span>{interest}</span>
        <span className="bg-green-200 text-green-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">{count}</span>
      </button>
    ));
  };

  return (
    <>
      <div className="w-[350px] max-w-full mx-auto">
        <div className="flex flex-wrap justify-center gap-2 min-h-[36px] mb-4">
            {Array.from(interests).map(interest => <InterestTag key={interest} text={interest} onRemove={removeInterest} />)}
        </div>
        <Input id="interest-input" type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={handleKeyDown} className="rounded-full py-6 px-6 focus-visible:border-green-500 focus-visible:ring-green-500 ring-offset-1 text-center" placeholder="Type an interest & press Enter" maxLength={26}/>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Popular Topics</h3>
        <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">{renderPopularInterests()}</div>
      </div>
      
      <div className="mt-12 w-[350px] max-w-full mx-auto">
        <Button onClick={handleFindMatch} disabled={isConnecting || (interests.size === 0 && !currentInput.trim())} className="w-full rounded-full py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-base disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
          {isConnecting ? (
            <>
              <LoadingSpinner />
              {status}
            </>
          ) : (
            'Find Match'
          )}
        </Button>
      </div>

      <div className="text-center mt-6">
          <Button variant="secondary" className="text-gray-500 hover:text-green-600 transition-colors" onClick={() => setIsFeedbackDialogOpen(true)}>
              <MessageSquarePlus size={16} className="mr-2"/>
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