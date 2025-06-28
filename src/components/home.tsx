"use client";

import BackgroundElements from "../components/ui/background-elements";
import { useState } from "react";
import InterestSelector from "../components/interests-selector";
import Chat from "../components/chat"; 
import { useAnimochatV2 } from "../hooks/useAnimochat";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from 'next/link';
import { Server } from 'lucide-react';

export default function Home() {
  const {
    screen,
    userId,
    status,
    messages,
    startMatchmaking,
    onChangeTheme,
    disconnect,
    editMessage,
    sendMessage,
    onReact,
    onCancelMatchmaking,
    onStartTyping,
    handleGetStarted,
    isStrangerTyping,
  } = useAnimochatV2();

  const isConnecting = false;

  const [interests, setInterests] = useState<Set<string>>(new Set());

  const handleFindMatch = (interestsToMatch: Set<string>) => {
    if (interestsToMatch.size === 0) {
      handleGetStarted()
      return;
    }
    startMatchmaking(Array.from(interestsToMatch));
  };
  
  // Animation properties for page transitions
  // This defines how a screen will enter and exit the view.
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.23, ease: "easeInOut" },
  } as Variants;

  const renderScreen = () => {
    switch (screen) {
      case "chat":
        return (
           <motion.div 
              key="chat"
              {...pageTransition}
              className="h-full w-full flex items-center justify-center sm:p-4"
            >
              <Chat
                goBack={() => {
                    handleGetStarted();
                }}
                onEditMessage={editMessage}
                onStartTyping={onStartTyping}
                cancelMatchmaking={onCancelMatchmaking}
                isStrangerTyping={isStrangerTyping}
                onReact={onReact}
                onChangeTheme={onChangeTheme}
                messages={messages}
                sendMessage={sendMessage}
                newChat={() => {
                  handleFindMatch(interests);
                }}
                endChat={disconnect}
                peerId={userId}
                status={status}
              />
          </motion.div>
        );

      case "matchmaking":
        return (
          <motion.div 
            key="matchmaking"
            {...pageTransition}
            className="w-full h-full flex flex-col justify-center items-center"
          >
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
          </motion.div>
        );

      case "intro":
      default:
        return (
          <motion.div 
            key="intro"
            {...pageTransition}
            className="w-full h-full flex flex-col justify-center items-center"
          >
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
            
            <div className="max-w-md mx-auto text-sm space-y-6 text-center">
                <div className="text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200 font-medium">
                    <p>This is a test version of AnimoChat. Not all features are implemented, and you may encounter bugs.</p>
                </div>
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="rounded-full py-7 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
        <main className={`container h-full mx-auto flex flex-col ${screen === 'chat' ? 'p-0' : 'px-4 py-8 md:py-16'}`}>
            {screen !== 'chat' && <BackgroundElements />}

            <div className="flex-grow flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                  {renderScreen()}
                </AnimatePresence>
            </div>

            {screen !== 'chat' && (
                <footer className="text-xs text-gray-500 text-center py-4 shrink-0">
                    <h3 className="py-4">
                        Created by developers from{" "}
                        <span className="text-green-700 font-semibold">
                        De La Salle Lipa
                        </span>
                    </h3>
                    {userId && (
                        <p className="font-mono text-gray-400 text-[10px] mt-2">
                        Your User ID: {userId}
                        </p>
                    )}
                    <div className="mt-4">
                        <Link href="/status" passHref>
                            <Button variant="ghost" className="text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                                <Server className="h-4 w-4 mr-2" />
                                Service Status
                            </Button>
                        </Link>
                    </div>
                </footer>
            )}
        </main>
    </div>
  );
}
