import { ChatThemeV2 } from "./chat-theme";


export const defaultTheme: ChatThemeV2 = {
  name: "Default Green",
  typography: {
    fontFamily: "inherit", // Uses the default font of the page
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#16a34a", dark: "#16a34a" },
    faded: { light: "rgba(22, 163, 74, 0.1)", dark: "rgba(34, 197, 94, 0.1)" },
  },
  secondaryText: { light: "#6b7280", dark: "#9ca3af" },
  errorText: { light: "#b91c1c", dark: "#ef4444" },
  linkColor: { light: "#2563eb", dark: "#3b82f6" },
  announcement: {
    background: { light: "#ffffff", dark: "#1f2937" },
    text: { light: "#111827", dark: "#f9fafb" },
    border: { light: "rgba(229, 231, 235, 0.8)", dark: "rgba(55, 65, 81, 0.8)" },
  },
  animations: {
    typingIndicatorDots: {
        dark: "#f9fafb",
        light: "#111827",
    }
  },
  messageList: {
    scrollbarThumb: { light: "#9ca3af", dark: "#6b7280" },
    scrollbarTrack: { light: "#f3f4f6", dark: "#111827" },
  },
  overlays: {
    emojiMenu: {
        background: { light: "#f3f4f6", dark: "#1f2937" },
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // "shadow-md"
    },
    replyingPreview: {
        background: { light: "#f3f4f6", dark: "#1f2937" },
        border: { light: "#16a34a", dark: "#16a34a" },
        closeIcon: {
            light: "#6b7280",
            dark: "#9ca3af",
        },
        description: {
            light: "#111827",
            dark: "#f9fafb",
        },
        title: {
            light: "#111827",
            dark: "#f9fafb",
        }
    }
  },
  general: {
    background: { light: "#ffffff", dark: "#111827" },
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: { light: "rgba(255, 255, 255, 0.6)", dark: "rgba(29, 39, 53, 0.6)" },
    border: { light: "rgba(229, 231, 235, 0.8)", dark: "rgba(55, 65, 81, 0.8)" },
    statusLabel: { light: "#6b7280", dark: "#9ca3af" },
    statusValue: { light: "#16a34a", dark: "#16a34a" },
  },
  message: {
     myMessage: {
        background: { light: '#16a34a', dark: '#16a34a' },
        text: { light: '#ffffff', dark: '#ffffff' },
        isAnimated: false,
     },
     strangerMessage: {
        background: { light: '#f3f4f6', dark: '#374151' },
        text: { light: '#1f2937', dark: '#f9fafb' },
        isAnimated: false,
     },
     systemMessage: {
        background: { light: '#f3f4f6', dark: '#1f2937' },
        text: { light: '#6b7280', dark: '#9ca3af' },
     },
     deletedMessage: {
        text: { light: "#6b7280", dark: "#9ca3af" },
    },
    imageOverlay: {
        background: { light: "rgba(0, 0, 0, 0.4)", dark: "rgba(0, 0, 0, 0.4)" },
        text: { light: "#ffffff", dark: "#ffffff" },
    },
  },
  inputArea: {
    background: { light: "rgba(255, 255, 255, 0.6)", dark: "rgba(29, 39, 53, 0.6)" },
    border: { light: "rgba(229, 231, 235, 0.8)", dark: "rgba(55, 65, 81, 0.8)" },
    inputBackground: { light: "rgba(255, 255, 255, 0.8)", dark: "rgba(55, 65, 81, 0.5)" },
    inputText: { light: "#111827", dark: "#f9fafb" },
    placeholderText: { light: "#9ca3af", dark: "#6b7280" },
    focusRing: { light: "#16a34a", dark: "#16a34a" },
  },
  buttons: {
    primary: {
      background: { light: "#16a34a", dark: "#16a34a" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#15803d", dark: "#16a34a" },
    },
    secondary: {
      background: { light: "#fff", dark: "#374151" },
      text: { light: "#1f2937", dark: "#f9fafb" },
      hoverBackground: { light: "#d1d5db", dark: "#4b5563" },
      border: { light: "#d1d5db", dark: "#4b5563" }
    },
    destructive: {
      background: { light: "#dc2626", dark: "#ef4444" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#b91c1c", dark: "#dc2626" },
      border: { light: "#dc2626", dark: "#ef4444" }
    },
    newMessages: {
      background: { light: "#f59e0b", dark: "#fcd347" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#d97706", dark: "#f59e0b" },
    },
    
  },
  reactions: {
    bubble: {
      background: { light: "#f3f4f6", dark: "#374151" },
      border: { light: "#ffffff", dark: "#111827" },
      text: { light: "#111827", dark: "#f3f4f6" },
    },
  },
};




export const tyronsTheme: ChatThemeV2 = {
  name: "Tyron's Theme",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#ee9ca7", dark: "#e18ea6" },
    faded: { light: "rgba(238, 156, 167, 0.15)", dark: "rgba(225, 142, 166, 0.15)" },
  },
  secondaryText: { light: "#a195a0", dark: "#b0a5af" },
  errorText: { light: "#f87171", dark: "#f87171" },
  linkColor: { light: "#9333ea", dark: "#c084fc" },
  announcement: {
    background: { light: "#fff9fb", dark: "#4c3b4d" },
    text: { light: "#5c4754", dark: "#fdecf2" },
    border: { light: "#fceaf2", dark: "#604d60" },
  },
  animations: {
    typingIndicatorDots: {
        dark: "#fdecf2",
        light: "#d66983",
    }
  },
  messageList: {
    scrollbarThumb: { light: "#fceaf2", dark: "#7c5c7a" },
    scrollbarTrack: { light: "#fff9fb", dark: "#302830" },
  },
  overlays: {
    emojiMenu: {
        background: { light: "#fff9fb", dark: "#302830" },
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    replyingPreview: {
        background: { light: "#fdecf2", dark: "#4c3b4d" },
        border: { light: "#ee9ca7", dark: "#e18ea6" },
        closeIcon: {
            light: "#a195a0",
            dark: "#b0a5af",
        },
        description: {
            light: "#5c4754",
            dark: "#fdecf2",
        },
        title: {
            light: "#d66983",
            dark: "#ee9ca7",
        }
    }
  },
  general: {
    background: { light: "#fffbff", dark: "#302830" },
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: { light: "rgba(255, 249, 251, 0.6)", dark: "rgba(48, 40, 48, 0.6)" },
    border: { light: "rgba(253, 236, 242, 0.8)", dark: "rgba(76, 59, 77, 0.8)" },
    statusLabel: { light: "#a195a0", dark: "#b0a5af" },
    statusValue: { light: "#d66983", dark: "#ee9ca7" },
  },
  message: {
     myMessage: {
        background: { light: "#ee9ca7", dark: "#e18ea6" },
        text: { light: "#ffffff", dark: "#ffffff" },
        isAnimated: false,
     },
     strangerMessage: {
        background: { light: "#fdecf2", dark: "#4c3b4d" },
        text: { light: "#5c4754", dark: "#fdecf2" },
        isAnimated: false,
     },
     systemMessage: {
        background: { light: "#fdecf2", dark: "#4c3b4d" },
        text: { light: "#a195a0", dark: "#b0a5af" },
     },
     deletedMessage: {
        text: { light: "#a195a0", dark: "#b0a5af" },
    },
    imageOverlay: {
        background: { light: "rgba(0, 0, 0, 0.4)", dark: "rgba(0, 0, 0, 0.4)" },
        text: { light: "#ffffff", dark: "#ffffff" },
    },
  },
  inputArea: {
    background: { light: "rgba(255, 249, 251, 0.6)", dark: "rgba(48, 40, 48, 0.6)" },
    border: { light: "rgba(253, 236, 242, 0.8)", dark: "rgba(76, 59, 77, 0.8)" },
    inputBackground: { light: "#fffbff", dark: "rgba(76, 59, 77, 0.5)" },
    inputText: { light: "#5c4754", dark: "#ee9ca7" },
    placeholderText: { light: "#a195a0", dark: "#7c5c7a" },
    focusRing: { light: "#ee9ca7", dark: "#e18ea6" },
  },
  buttons: {
    primary: {
      background: { light: "#ee9ca7", dark: "#e18ea6" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#e18ea6", dark: "#d66983" },
    },
    secondary: {
      background: { light: "#fffbff", dark: "#4c3b4d" },
      text: { light: "#d66983", dark: "#ee9ca7" },
      hoverBackground: { light: "#fdecf2", dark: "#604d60" },
      border: { light: "#fceaf2", dark: "#604d60" }
    },
    destructive: {
      background: { light: "#fca5a5", dark: "#ef4444" },
      text: { light: "#7f1d1d", dark: "#ffffff" },
      hoverBackground: { light: "#f87171", dark: "#dc2626" },
      border: { light: "#fca5a5", dark: "#ef4444" }
    },
    newMessages: {
      background: { light: "#fb923c", dark: "#fdba74" },
      text: { light: "#ffffff", dark: "#431407" },
      hoverBackground: { light: "#f97316", dark: "#fb923c" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#fdecf2", dark: "#604d60" },
      border: { light: "#fffbff", dark: "#302830" },
      text: { light: "#d66983", dark: "#ee9ca7" },
    },
  },
};

