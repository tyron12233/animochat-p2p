// App.tsx

"use client";

import BackgroundElements from "../components/ui/background-elements";
import { useState } from "react";
import InterestSelector from "../components/interests-selector";
import Chat from "../components/chat"; 
import { useAnimoChat } from "../hooks/useAnimochat";
import { Button } from "@/components/ui/button";

export default function App() {
  const {
    screen,
    peerId,
    status,
    isConnecting,
    messages,
    handleGetStarted,
    startMatchmaking,
    endChat,
    sendMessage,
    onReact,
    isPeerOutdated, // Import the flag for the UI
  } = useAnimoChat();

  const [interests, setInterests] = useState<Set<string>>(new Set());

  const handleFindMatch = (interestsToMatch: Set<string>) => {
    if (interestsToMatch.size === 0) return;
    startMatchmaking(Array.from(interestsToMatch));
  };

  const renderScreen = () => {
    switch (screen) {
      case "chat":
        return (
           <div className="h-full w-full flex items-center justify-center sm:p-4">
              <Chat
                onReact={onReact}
                messages={messages}
                sendMessage={sendMessage}
                endChat={endChat}
                peerId={peerId}
                status={status}
              />
          </div>
        );

      case "matchmaking":
        return (
          <>
            <div className="max-w-3xl mx-auto relative w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Choose Your Interests
                </h2>
                <p className="text-gray-600 text-lg my-8">
                  Find someone to chat with based on what you like.
                </p>
              </div>
            </div>
            <InterestSelector
              interests={interests}
              onInterestsChange={setInterests}
              onFindMatch={handleFindMatch}
              isConnecting={isConnecting}
              status={status}
            />
          </>
        );

      case "intro":
      default:
        return (
          <>
            <div className="max-w-3xl mx-auto relative w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Real-time
                  <br />
                  Anonymous Chat
                </h2>
                <p className="text-gray-600 text-lg my-8">
                  Connect with students anonymously and securely.
                </p>
              </div>
            </div>
            
            {/* --- NEW: P2P and Test Information --- */}
            <div className="max-w-md mx-auto text-sm space-y-6 text-center">
                <details className="text-gray-500 bg-gray-50/80 p-3 rounded-2xl border border-gray-200">
                    <summary className="cursor-pointer font-medium hover:text-green-600">What is Peer-to-Peer (P2P) Chat?</summary>
                    <p className="mt-2 text-left">
                        Peer-to-Peer chat means your messages go directly to the other user without passing through a central server. This provides better privacy and can be faster. Our server only helps to "introduce" two users to each other.
                    </p>
                </details>

                <div className="text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200 font-medium">
                    <p>This is a test version of AnimoChat. Not all features are implemented, and you may encounter bugs.</p>
                </div>
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={handleGetStarted}
                disabled={isConnecting}
                size="lg"
                className="rounded-full py-7 px-8 bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
              >
                {isConnecting ? "Initializing..." : "Get Started"}
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
        {/* The main container now adapts its padding based on the screen */}
        <main className={`container h-full mx-auto flex flex-col ${screen === 'chat' ? 'p-0' : 'px-4 py-8 md:py-16'}`}>
            {/* Background is only shown on intro/matchmaking screens */}
            {screen !== 'chat' && <BackgroundElements />}

            <div className="flex-grow flex flex-col justify-center items-center">
                {renderScreen()}
            </div>

            {/* Footer is only shown on intro/matchmaking screens */}
            {screen !== 'chat' && (
                <footer className="text-xs text-gray-500 text-center py-4 shrink-0">
                    <h3 className="py-4">
                        Created by developers from{" "}
                        <span className="text-green-700 font-semibold">
                        De La Salle Lipa
                        </span>
                    </h3>
                    {peerId && (
                        <p className="font-mono text-gray-400 text-[10px] mt-2">
                        Your Peer ID: {peerId}
                        </p>
                    )}
                </footer>
            )}
        </main>
    </div>
  );
}
