// components/InterestSelector.tsx

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

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

// --- CHILD COMPONENT ---
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

// --- HELPER COMPONENT ---
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- MAIN COMPONENT ---
export default function InterestSelector({ interests, onInterestsChange, onFindMatch, isConnecting, status }: InterestSelectorProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [popularInterests, setPopularInterests] = useState<PopularInterest[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    </>
  );
}
