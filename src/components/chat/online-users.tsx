import { Participant } from "@/src/hooks/useAnimochat";
import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const userColorMap = [
  "bg-sky-400/70 border-sky-300",
  "bg-emerald-400/70 border-emerald-300",
  "bg-amber-400/70 border-amber-300",
  "bg-violet-400/70 border-violet-300",
  "bg-rose-400/70 border-rose-300",
  "bg-cyan-400/70 border-cyan-300",
  "bg-lime-400/70 border-lime-300",
  "bg-pink-400/70 border-pink-300",
  "bg-indigo-400/70 border-indigo-300",
  "bg-teal-400/70 border-teal-300",
];

// Generates a consistent color for a user based on their ID.
const getUserColor = (userId: string) => {
  // A simple hash function to assign a color based on the user ID string.
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % userColorMap.length);
  return userColorMap[index];
};

const UserListModal = ({
  isOpen,
  onClose,
  users,
  theme,
  mode,
}: {
  theme: ChatThemeV2;
  mode: "light" | "dark";
  isOpen: boolean;
  onClose: () => void;
  users: Participant[];
}) => {
  const onlineUsers = users.filter((user) => user.status === "online");
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
            style={{
              background: theme.general.background[mode],
              borderColor: theme.buttons.secondary?.border?.[mode] ?? "",
              boxShadow: `0 4px 30px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.1)`,
            }}
          >
            <header
              className="flex items-center justify-between p-4 border-b rounded-t-2xl"
              style={{
                backgroundColor: theme.header.background[mode],
                borderColor: theme.buttons.secondary?.border?.[mode] ?? "",
                color: theme.header.statusLabel[mode] ?? "white",
              }}
            >
              <h2
                className="text-lg font-bold"
                style={{
                  color: theme.header.statusLabel[mode] ?? "white",
                }}
              >
                All Online Users ({onlineUsers.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </header>
            <div
              className="p-6 overflow-y-auto"
              style={{
                color: theme.header.statusLabel[mode] ?? "white",
              }}
            >
              <ul className="space-y-4">
                {onlineUsers.map((user) => (
                  <li key={user.userId} className="flex items-center gap-4">
                    <div
                      className={`relative h-10 w-10 rounded-full border-2 ${getUserColor(
                        user.userId
                      )} flex items-center justify-center font-bold text-white text-lg flex-shrink-0`}
                    >
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.nickname}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// == Component to Creatively Visualize Online Users ==
// Displays users as a series of overlapping, glowing orbs with join/leave animations.
const OnlineUsers = ({
  users,
  theme,
  mode,
  onOverflowClick,
}: {
  users: Participant[];
  onOverflowClick: () => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
}) => {
  const maxVisibleUsers = 3;
  const eligibleUsers = users.filter((user) => user.status === "online");
  const visibleUsers = eligibleUsers.slice(0, maxVisibleUsers);
  const hiddenUsersCount = eligibleUsers.length - maxVisibleUsers;

  console.log("Online Users:", eligibleUsers);
  return (
    <AnimatePresence>
      {eligibleUsers.length > 0 && (
        <div
          className="flex items-center space-x-2 p-3 rounded-full border transition-all"
          style={{
            background: theme.general.background[mode],
            borderColor: theme.buttons.secondary?.border?.[mode] ?? "",
          }}
        >
          {/* <Users className="text-slate-400 h-5 w-5 flex-shrink-0" /> */}
          <div className="flex items-center -space-x-3">
            <AnimatePresence>
              {visibleUsers.map((user, index) => (
                <motion.div
                  key={user.userId}
                  layout
                  initial={{ opacity: 0, scale: 0.5, x: 25 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{ opacity: 0, scale: 0.5, x: -25 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`
                relative h-7 w-7 rounded-full border-2 ${getUserColor(
                  user.userId
                )}
                flex items-center justify-center font-bold text-white text-sm
                shadow-lg transition-transform hover:-translate-y-1 hover:z-10
                animate-pulse-slow group
              `}
                  style={{ animationDelay: `${index * 130}ms` }}
                >
                  {user.nickname.charAt(0).toUpperCase()}
                  <div className="absolute bottom-full mb-2 w-max px-3 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {user.nickname}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                  </div>
                </motion.div>
              ))}
              {hiddenUsersCount > 0 && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={onOverflowClick}
                  className="relative h-7 w-7 rounded-full border-2 bg-slate-600 border-slate-500 flex items-center justify-center font-bold text-white text-xs shadow-lg cursor-pointer hover:bg-slate-500 transition-colors"
                >
                  +{hiddenUsersCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { UserListModal, OnlineUsers };
