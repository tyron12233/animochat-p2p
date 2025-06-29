import { ChatThemeV2 } from "./chat-theme";

export const cosmicLatteTheme: ChatThemeV2 = {
  name: "Cosmic Latte",
  typography: {
    fontFamily: "'Space Mono', monospace",
    baseFontSize: "15px",
  },
  accent: {
    main: { light: "#c59c6c", dark: "#d4b38a" },
    faded: {
      light: "rgba(197, 156, 108, 0.15)",
      dark: "rgba(212, 179, 138, 0.1)",
    },
  },
  secondaryText: { light: "#6d4c41", dark: "#a1887f" },
  errorText: { light: "#d32f2f", dark: "#ef9a9a" },
  linkColor: { light: "#81d4fa", dark: "#4fc3f7" },
  announcement: {
    background: { light: "#f5f5f5", dark: "#2a211c" },
    text: { light: "#4e342e", dark: "#d7ccc8" },
    border: {
      light: "rgba(212, 179, 138, 0.5)",
      dark: "rgba(212, 179, 138, 0.2)",
    },
  },
  animations: {
    typingIndicatorDots: {
      dark: "#d4b38a",
      light: "#c59c6c",
    },
  },
  messageList: {
    scrollbarThumb: { light: "#bcaaa4", dark: "#6d4c41" },
    scrollbarTrack: { light: "#eFEBE9", dark: "#1e1511" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#fff", dark: "#3e2723" },
      shadow: "0 4px 8px -1px rgba(0, 0, 0, 0.15)",
    },
    replyingPreview: {
      background: { light: "#f5f5f5", dark: "#2a211c" },
      border: { light: "#c59c6c", dark: "#d4b38a" },
      closeIcon: { light: "#8d6e63", dark: "#bcaaa4" },
      description: { light: "#5d4037", dark: "#d7ccc8" },
      title: { light: "#4e342e", dark: "#ffffff" },
    },
  },
  general: {
    background: { light: "#efebe9", dark: "#1e1511" },
    backdropBlur: "1rem",
    shadow: "0 15px 35px -10px rgb(0 0 0 / 0.25)",
    borderRadius: "1.25rem",
  },
  header: {
    background: {
      light: "rgba(239, 235, 233, 0.8)",
      dark: "rgba(30, 21, 17, 0.8)",
    },
    border: {
      light: "rgba(215, 204, 200, 0.8)",
      dark: "rgba(42, 33, 28, 0.8)",
    },
    statusLabel: { light: "#8d6e63", dark: "#a1887f" },
    statusValue: { light: "#8d6e63", dark: "#d4b38a" },
  },
  message: {
    myMessage: {
      background: { light: "#c59c6c", dark: "#8a6b4a" },
      text: { light: "#ffffff", dark: "#f5f5f5" },
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#ffffff", dark: "#4e342e" },
      text: { light: "#4e342e", dark: "#d7ccc8" },
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "transparent", dark: "transparent" },
      text: { light: "#a1887f", dark: "#8d6e63" },
    },
    deletedMessage: {
      text: { light: "#bcaaa4", dark: "#a1887f" },
    },
    imageOverlay: {
      background: {
        light: "rgba(78, 52, 46, 0.5)",
        dark: "rgba(0, 0, 0, 0.5)",
      },
      text: { light: "#ffffff", dark: "#ffffff" },
    },
  },
  inputArea: {
    background: {
      light: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(42, 33, 28, 0.6)",
    },
    border: {
      light: "rgba(215, 204, 200, 0.9)",
      dark: "rgba(62, 39, 35, 0.9)",
    },
    inputBackground: { light: "#ffffff", dark: "#5d4037" },
    inputText: { light: "#3e2723", dark: "#f5f5f5" },
    placeholderText: { light: "#a1887f", dark: "#a1887f" },
    focusRing: { light: "#c59c6c", dark: "#d4b38a" },
  },
  buttons: {
    primary: {
      background: { light: "#a1887f", dark: "#c59c6c" },
      text: { light: "#ffffff", dark: "#3e2723" },
      hoverBackground: { light: "#8d6e63", dark: "#d4b38a" },
    },
    secondary: {
      background: { light: "#fff", dark: "#5d4037" },
      text: { light: "#6d4c41", dark: "#d7ccc8" },
      hoverBackground: { light: "#efebe9", dark: "#6d4c41" },
      border: { light: "#d7ccc8", dark: "#8d6e63" },
    },
    destructive: {
      background: { light: "#c62828", dark: "#d32f2f" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#b71c1c", dark: "#c62828" },
      border: { light: "#c62828", dark: "#d32f2f" },
    },
    newMessages: {
      background: { light: "#80deea", dark: "#4dd0e1" },
      text: { light: "#006064", dark: "#004d40" },
      hoverBackground: { light: "#4dd0e1", dark: "#26c6da" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#ffffff", dark: "#6d4c41" },
      border: { light: "#d7ccc8", dark: "#1e1511" },
      text: { light: "#c59c6c", dark: "#f5f5f5" },
    },
  },
};

export const sunsetBlissTheme: ChatThemeV2 = {
  name: "Sunset Bliss",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#FF6B6B", dark: "#FF6B6B" },
    faded: {
      light: "rgba(255, 107, 107, 0.15)",
      dark: "rgba(255, 107, 107, 0.15)",
    },
  },
  secondaryText: { light: "#6D6875", dark: "#A5A58D" },
  errorText: { light: "#E63946", dark: "#F28B82" },
  linkColor: { light: "#F08A5D", dark: "#F08A5D" },
  announcement: {
    background: { light: "#FFF1E6", dark: "#332F2C" },
    text: { light: "#3D315B", dark: "#F1E4CE" },
    border: {
      light: "rgba(253, 230, 138, 0.8)",
      dark: "rgba(59, 50, 53, 0.8)",
    },
  },
  animations: {
    typingIndicatorDots: { dark: "#F1E4CE", light: "#3D315B" },
  },
  messageList: {
    scrollbarThumb: { light: "#E9C46A", dark: "#8D8680" },
    scrollbarTrack: { light: "#FFF8E1", dark: "#2A2825" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#FFFAF0", dark: "#3E3B37" },
      shadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    replyingPreview: {
      background: { light: "#FFF1E6", dark: "#332F2C" },
      border: { light: "#FF6B6B", dark: "#FF6B6B" },
      closeIcon: { light: "#6D6875", dark: "#A5A58D" },
      description: { light: "#3D315B", dark: "#F1E4CE" },
      title: { light: "#3D315B", dark: "#F1E4CE" },
    },
  },
  general: {
    background: { light: "#FFF8E1", dark: "#1F1E1C" },
    backdropBlur: "1.5rem",
    shadow: "0 20px 40px rgba(0,0,0,0.2)",
    borderRadius: "1.5rem",
  },
  header: {
    background: {
      light: "rgba(255, 255, 255, 0.7)",
      dark: "rgba(40, 38, 35, 0.7)",
    },
    border: { light: "rgba(229,231,235,0.8)", dark: "rgba(55,65,81,0.8)" },
    statusLabel: { light: "#6D6875", dark: "#A5A58D" },
    statusValue: { light: "#FF6B6B", dark: "#FF6B6B" },
  },
  message: {
    myMessage: {
      background: { light: "#FF6B6B", dark: "#FF6B6B" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#FFF1E6", dark: "#3E3B37" },
      text: { light: "#3D315B", dark: "#F1E4CE" },
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "#E9C46A", dark: "#3E3B37" },
      text: { light: "#6D6875", dark: "#A5A58D" },
    },
    deletedMessage: {
      text: { light: "#6D6875", dark: "#A5A58D" },
    },
    imageOverlay: {
      background: { light: "rgba(0,0,0,0.5)", dark: "rgba(0,0,0,0.5)" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
    },
  },
  inputArea: {
    background: {
      light: "rgba(255, 255, 255, 0.8)",
      dark: "rgba(40,38,35,0.8)",
    },
    border: { light: "rgba(229,231,235,0.8)", dark: "rgba(55,65,81,0.8)" },
    inputBackground: { light: "#FFFFFF", dark: "#4B483E" },
    inputText: { light: "#3D315B", dark: "#F1E4CE" },
    placeholderText: { light: "#A5A58D", dark: "#6D6875" },
    focusRing: { light: "#FF6B6B", dark: "#FF6B6B" },
  },
  buttons: {
    primary: {
      background: { light: "#FF6B6B", dark: "#FF6B6B" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#E63946", dark: "#E63946" },
    },
    secondary: {
      background: { light: "#FFF1E6", dark: "#3E3B37" },
      text: { light: "#3D315B", dark: "#F1E4CE" },
      hoverBackground: { light: "#FFE5D4", dark: "#5A564F" },
      border: { light: "#FFE5D4", dark: "#5A564F" },
    },
    destructive: {
      background: { light: "#E63946", dark: "#F28B82" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#D62828", dark: "#E63946" },
      border: { light: "#E63946", dark: "#F28B82" },
    },
    newMessages: {
      background: { light: "#F4A261", dark: "#E76F51" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#E76F51", dark: "#F4A261" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#FFF1E6", dark: "#3E3B37" },
      border: { light: "#FFFFFF", dark: "#1F1E1C" },
      text: { light: "#3D315B", dark: "#F1E4CE" },
    },
  },
};

export const auroraGlowTheme: ChatThemeV2 = {
  name: "Aurora Glow",
  typography: { fontFamily: "inherit", baseFontSize: "16px" },
  accent: {
    main: { light: "#8E44AD", dark: "#8E44AD" },
    faded: { light: "rgba(142,68,173,0.15)", dark: "rgba(142,68,173,0.15)" },
  },
  secondaryText: { light: "#2C3E50", dark: "#BDC3C7" },
  errorText: { light: "#C0392B", dark: "#E74C3C" },
  linkColor: { light: "#2980B9", dark: "#3498DB" },
  announcement: {
    background: { light: "#F5EEF8", dark: "#1A1A1D" },
    text: { light: "#4A235A", dark: "#F8F9F9" },
    border: { light: "rgba(155,89,182,0.8)", dark: "rgba(26,26,29,0.8)" },
  },
  animations: { typingIndicatorDots: { dark: "#F8F9F9", light: "#4A235A" } },
  messageList: {
    scrollbarThumb: { light: "#A569BD", dark: "#7D3C98" },
    scrollbarTrack: { light: "#F9EBEA", dark: "#1A1A1D" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#FAE3F5", dark: "#2C2A2E" },
      shadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    replyingPreview: {
      background: { light: "#F5EEF8", dark: "#1A1A1D" },
      border: { light: "#8E44AD", dark: "#8E44AD" },
      closeIcon: { light: "#2C3E50", dark: "#BDC3C7" },
      description: { light: "#4A235A", dark: "#F8F9F9" },
      title: { light: "#4A235A", dark: "#F8F9F9" },
    },
  },
  general: {
    background: {
      light: "linear-gradient(45deg, #FFC0CB 0%, #8E44AD 100%)",
      dark: "linear-gradient(45deg, #0D0D0D 0%, #4A235A 100%)",
    },
    backdropBlur: "1rem",
    shadow: "0 20px 35px rgba(0,0,0,0.15)",
    borderRadius: "1.25rem",
  },
  header: {
    background: { light: "rgba(255,255,255,0.7)", dark: "rgba(15,15,15,0.7)" },
    border: { light: "rgba(224,224,224,0.8)", dark: "rgba(40,40,40,0.8)" },
    statusLabel: { light: "#2C3E50", dark: "#BDC3C7" },
    statusValue: { light: "#8E44AD", dark: "#8E44AD" },
  },
  message: {
    myMessage: {
      background: { light: "#8E44AD", dark: "#8E44AD" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#FAE3F5", dark: "#2C2A2E" },
      text: { light: "#4A235A", dark: "#F8F9F9" },
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "#f5f5f5", dark: "#2C2A2E" },
      text: { light: "#2C3E50", dark: "#BDC3C7" },
    },
    deletedMessage: { text: { light: "#2C3E50", dark: "#BDC3C7" } },
    imageOverlay: {
      background: { light: "rgba(0,0,0,0.5)", dark: "rgba(0,0,0,0.5)" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
    },
  },
  inputArea: {
    background: { light: "rgba(255,255,255,0.8)", dark: "rgba(15,15,15,0.8)" },
    border: { light: "rgba(224,224,224,0.8)", dark: "rgba(40,40,40,0.8)" },
    inputBackground: { light: "#FFFFFF", dark: "#3E3B37" },
    inputText: { light: "#4A235A", dark: "#F8F9F9" },
    placeholderText: { light: "#BDC3C7", dark: "#2C3E50" },
    focusRing: { light: "#8E44AD", dark: "#8E44AD" },
  },
  buttons: {
    primary: {
      background: { light: "#8E44AD", dark: "#8E44AD" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#732D91", dark: "#732D91" },
    },
    secondary: {
      background: { light: "#FAE3F5", dark: "#2C2A2E" },
      text: { light: "#4A235A", dark: "#F8F9F9" },
      hoverBackground: { light: "#FADADD", dark: "#4A2236" },
      border: { light: "#FADADD", dark: "#4A2236" },
    },
    destructive: {
      background: { light: "#C0392B", dark: "#E74C3C" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#922B21", dark: "#C0392B" },
      border: { light: "#C0392B", dark: "#E74C3C" },
    },
    newMessages: {
      background: { light: "#2980B9", dark: "#3498DB" },
      text: { light: "#FFFFFF", dark: "#FFFFFF" },
      hoverBackground: { light: "#1F6391", dark: "#2980B8" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#FAE3F5", dark: "#2C2A2E" },
      border: { light: "#FFFFFF", dark: "#0D0D0D" },
      text: { light: "#4A235A", dark: "#F8F9F9" },
    },
  },
};

export const prideCelebrationTheme: ChatThemeV2 = {
  name: "Pride Month",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)", dark: "linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)" },
    faded: { light: "rgba(0, 0, 0, 0.05)", dark: "rgba(255, 255, 255, 0.1)" },
  },
  secondaryText: { light: "#6b7280", dark: "#9ca3af" },
  errorText: { light: "#b91c1c", dark: "#ef4444" },
  linkColor: { light: "#2563eb", dark: "#3b82f6" },
  announcement: {
    background: { light: "#f3f4f6", dark: "#1f2937" },
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
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    replyingPreview: {
        background: { light: "#f3f4f6", dark: "#1f2937" },
        border: { light: "#4f46e5", dark: "#c7d2fe" },
        closeIcon: { light: "#6b7280", dark: "#9ca3af" },
        description: { light: "#111827", dark: "#f9fafb" },
        title: { light: "#111827", dark: "#f9fafb" },
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
    statusValue: { light: "#4f46e5", dark: "#a5b4fc" },
  },
  message: {
     myMessage: {
        background: { light: 'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)', dark: 'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)' },
        text: { light: '#000', dark: '#000' },
        isAnimated: true,
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
    focusRing: { light: "#4f46e5", dark: "#c7d2fe" },
  },
  buttons: {
    primary: {
      background: { light: "linear-gradient(90deg,rgba(224, 126, 126, 1) 0%, rgba(199, 184, 87, 1) 50%, rgba(237, 83, 229, 1) 100%);", dark: "linear-gradient(90deg,rgba(128, 69, 69, 1) 0%, rgba(122, 116, 69, 1) 50%, rgba(156, 56, 149, 1) 100%);" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "linear-gradient(90deg, #d30202, #ec8200, #ece200, #007022, #0043e6, #650676)", dark: "linear-gradient(90deg, #d30202, #ec8200, #ece200, #007022, #0043e6, #650676)" },
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
    border: {
      light: "rgba(229, 231, 235, 0.8)",
      dark: "rgba(55, 65, 81, 0.8)",
    },
  },
  animations: {
    typingIndicatorDots: {
      dark: "#f9fafb",
      light: "#111827",
    },
  },
  messageList: {
    scrollbarThumb: { light: "#9ca3af", dark: "#6b7280" },
    scrollbarTrack: { light: "#f3f4f6", dark: "#111827" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#f3f4f6", dark: "#1f2937" },
      shadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // "shadow-md"
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
      },
    },
  },
  general: {
    background: { light: "#ffffff", dark: "#111827" },
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: {
      light: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(29, 39, 53, 0.6)",
    },
    border: {
      light: "rgba(229, 231, 235, 0.8)",
      dark: "rgba(55, 65, 81, 0.8)",
    },
    statusLabel: { light: "#6b7280", dark: "#9ca3af" },
    statusValue: { light: "#16a34a", dark: "#16a34a" },
  },
  message: {
    myMessage: {
      background: { light: "#16a34a", dark: "#16a34a" },
      text: { light: "#ffffff", dark: "#ffffff" },
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#f3f4f6", dark: "#374151" },
      text: { light: "#1f2937", dark: "#f9fafb" },
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "#f3f4f6", dark: "#1f2937" },
      text: { light: "#6b7280", dark: "#9ca3af" },
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
    background: {
      light: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(29, 39, 53, 0.6)",
    },
    border: {
      light: "rgba(229, 231, 235, 0.8)",
      dark: "rgba(55, 65, 81, 0.8)",
    },
    inputBackground: {
      light: "rgba(255, 255, 255, 0.8)",
      dark: "rgba(55, 65, 81, 0.5)",
    },
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
      border: { light: "#d1d5db", dark: "#4b5563" },
    },
    destructive: {
      background: { light: "#dc2626", dark: "#ef4444" },
      text: { light: "#ffffff", dark: "#ffffff" },
      hoverBackground: { light: "#b91c1c", dark: "#dc2626" },
      border: { light: "#dc2626", dark: "#ef4444" },
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

export const monochromeTheme: ChatThemeV2 = {
  name: "Monochrome Theme",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#525252", dark: "#e5e5e5" }, // Neutral 600, Neutral 200
    faded: {
      light: "rgba(82, 82, 82, 0.15)",
      dark: "rgba(229, 229, 229, 0.15)",
    },
  },
  secondaryText: { light: "#a3a3a3", dark: "#a3a3a3" }, // Neutral 400
  errorText: { light: "#f87171", dark: "#ef4444" }, // Kept red for accessibility
  linkColor: { light: "#404040", dark: "#fafafa" }, // Neutral 700, Neutral 50
  announcement: {
    background: { light: "#fafafa", dark: "#262626" }, // Neutral 50, Neutral 800
    text: { light: "#525252", dark: "#d4d4d4" }, // Neutral 600, Neutral 300
    border: { light: "#e5e5e5", dark: "#404040" }, // Neutral 200, Neutral 700
  },
  animations: {
    typingIndicatorDots: {
      dark: "#d4d4d4", // Neutral 300
      light: "#737373", // Neutral 500
    },
  },
  messageList: {
    scrollbarThumb: { light: "#d4d4d4", dark: "#525252" }, // Neutral 300, Neutral 600
    scrollbarTrack: { light: "#fafafa", dark: "#171717" }, // Neutral 50, Neutral 900
  },
  overlays: {
    emojiMenu: {
      background: { light: "#ffffff", dark: "#171717" }, // White, Neutral 900
      shadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    replyingPreview: {
      background: { light: "#e5e5e5", dark: "#262626" }, // Neutral 200, Neutral 800
      border: { light: "#a3a3a3", dark: "#525252" }, // Neutral 400, Neutral 600
      closeIcon: {
        light: "#a3a3a3",
        dark: "#a3a3a3",
      },
      description: {
        light: "#404040",
        dark: "#d4d4d4",
      },
      title: {
        light: "#171717",
        dark: "#fafafa",
      },
    },
  },
  general: {
    background: { light: "#ffffff", dark: "#171717" }, // White, Neutral 900
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: {
      light: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(23, 23, 23, 0.6)", // Neutral 900 with opacity
    },
    border: {
      light: "rgba(229, 229, 229, 0.8)", // Neutral 200 with opacity
      dark: "rgba(64, 64, 64, 0.8)", // Neutral 700 with opacity
    },
    statusLabel: { light: "#a3a3a3", dark: "#a3a3a3" }, // Neutral 400
    statusValue: { light: "#404040", dark: "#e5e5e5" }, // Neutral 700, Neutral 200
  },
  message: {
    myMessage: {
      background: { light: "#262626", dark: "#e5e5e5" }, // Neutral 800, Neutral 200
      text: { light: "#ffffff", dark: "#171717" }, // White, Neutral 900
      isAnimated: false,
    },
    strangerMessage: {
      background: { light: "#e5e5e5", dark: "#262626" }, // Neutral 200, Neutral 800
      text: { light: "#171717", dark: "#e5e5e5" }, // Neutral 900, Neutral 200
      isAnimated: false,
    },
    systemMessage: {
      background: { light: "#fafafa", dark: "#262626" }, // Neutral 50, Neutral 800
      text: { light: "#a3a3a3", dark: "#a3a3a3" }, // Neutral 400
    },
    deletedMessage: {
      text: { light: "#a3a3a3", dark: "#737373" }, // Neutral 400, Neutral 500
    },
    imageOverlay: {
      background: { light: "rgba(0, 0, 0, 0.4)", dark: "rgba(0, 0, 0, 0.4)" },
      text: { light: "#ffffff", dark: "#ffffff" },
    },
  },
  inputArea: {
    background: {
      light: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(23, 23, 23, 0.6)",
    },
    border: {
      light: "rgba(229, 229, 229, 0.8)",
      dark: "rgba(64, 64, 64, 0.8)",
    },
    inputBackground: { light: "#ffffff", dark: "rgba(64, 64, 64, 0.5)" },
    inputText: { light: "#262626", dark: "#e5e5e5" },
    placeholderText: { light: "#a3a3a3", dark: "#737373" },
    focusRing: { light: "#525252", dark: "#a3a3a3" },
  },
  buttons: {
    primary: {
      background: { light: "#262626", dark: "#fafafa" }, // Neutral 800, Neutral 50
      text: { light: "#ffffff", dark: "#171717" }, // White, Neutral 900
      hoverBackground: { light: "#404040", dark: "#e5e5e5" }, // Neutral 700, Neutral 200
    },
    secondary: {
      background: { light: "#ffffff", dark: "#262626" }, // White, Neutral 800
      text: { light: "#404040", dark: "#e5e5e5" }, // Neutral 700, Neutral 200
      hoverBackground: { light: "#fafafa", dark: "#404040" }, // Neutral 50, Neutral 700
      border: { light: "#e5e5e5", dark: "#404040" }, // Neutral 200, Neutral 700
    },
    destructive: {
      background: { light: "#fca5a5", dark: "#ef4444" },
      text: { light: "#7f1d1d", dark: "#ffffff" },
      hoverBackground: { light: "#f87171", dark: "#dc2626" },
      border: { light: "#fca5a5", dark: "#ef4444" },
    },
    newMessages: {
      background: { light: "#fb923c", dark: "#fdba74" }, // Kept orange for visibility
      text: { light: "#ffffff", dark: "#431407" },
      hoverBackground: { light: "#f97316", dark: "#fb923c" },
    },
  },
  reactions: {
    bubble: {
      background: { light: "#e5e5e5", dark: "#404040" }, // Neutral 200, Neutral 700
      border: { light: "#ffffff", dark: "#171717" }, // White, Neutral 900
      text: { light: "#404040", dark: "#e5e5e5" }, // Neutral 700, Neutral 200
    },
  },
};


export const tyronsTheme: ChatThemeV2 = {
  name: "Tyron's Theme (flowery)",
  typography: {
    fontFamily: "inherit",
    baseFontSize: "16px",
  },
  accent: {
    main: { light: "#ee9ca7", dark: "#e18ea6" },
    faded: {
      light: "rgba(238, 156, 167, 0.15)",
      dark: "rgba(225, 142, 166, 0.15)",
    },
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
    },
  },
  messageList: {
    scrollbarThumb: { light: "#fceaf2", dark: "#7c5c7a" },
    scrollbarTrack: { light: "#fff9fb", dark: "#302830" },
  },
  overlays: {
    emojiMenu: {
      background: { light: "#fff9fb", dark: "#302830" },
      shadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
      },
    },
  },
  general: {
    background: { light: "#fffbff", dark: "#302830" },
    backdropBlur: "1.5rem",
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    borderRadius: "2rem",
  },
  header: {
    background: {
      light: "rgba(255, 249, 251, 0.6)",
      dark: "rgba(48, 40, 48, 0.6)",
    },
    border: {
      light: "rgba(253, 236, 242, 0.8)",
      dark: "rgba(76, 59, 77, 0.8)",
    },
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
    background: {
      light: "rgba(255, 249, 251, 0.6)",
      dark: "rgba(48, 40, 48, 0.6)",
    },
    border: {
      light: "rgba(253, 236, 242, 0.8)",
      dark: "rgba(76, 59, 77, 0.8)",
    },
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
      border: { light: "#fceaf2", dark: "#604d60" },
    },
    destructive: {
      background: { light: "#fca5a5", dark: "#ef4444" },
      text: { light: "#7f1d1d", dark: "#ffffff" },
      hoverBackground: { light: "#f87171", dark: "#dc2626" },
      border: { light: "#fca5a5", dark: "#ef4444" },
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
