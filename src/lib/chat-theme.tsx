export interface ColorScheme {
  light: string;
  dark: string;
}

export interface ButtonTheme {
  background: ColorScheme;
  text: ColorScheme;
  hoverBackground: ColorScheme;
  border?: ColorScheme;
}

export interface ChatThemeV2 {
  name: string;
  typography: {
    fontFamily: string;
    baseFontSize: string;
  };

  reactions: {
    bubble: {
      background: ColorScheme;
      border: ColorScheme;
      text: ColorScheme;
    };
  };

  general: {
    background: ColorScheme;
    backdropBlur: string;
    shadow: string;
    borderRadius: string;
  };

  header: {
    background: ColorScheme;
    border: ColorScheme;
    statusLabel: ColorScheme;
    statusValue: ColorScheme;
  };

  announcement: {
    background: ColorScheme;
    text: ColorScheme;
    border: ColorScheme;
  };

  messageList: {
    scrollbarThumb: ColorScheme;
    scrollbarTrack: ColorScheme;
  };

  message: {
    // Message bubbles for the current user
    myMessage: {
      background: ColorScheme;
      text: ColorScheme;
      isAnimated: boolean;
    };
    // Message bubbles for the other user (stranger)
    strangerMessage: {
      background: ColorScheme;
      text: ColorScheme;
      isAnimated: boolean;
    };
    deletedMessage: { text: ColorScheme };
    imageOverlay: { background: ColorScheme; text: ColorScheme };
    // System messages like "Chat ended"
    systemMessage: {
      background: ColorScheme;
      text: ColorScheme;
    };
  };

  inputArea: {
    background: ColorScheme;
    border: ColorScheme;
    inputBackground: ColorScheme;
    inputText: ColorScheme;
    placeholderText: ColorScheme;
    focusRing: ColorScheme;
  };

  accent: {
    main: ColorScheme;
    faded: ColorScheme;
  };

  secondaryText: ColorScheme;
  errorText: ColorScheme;
  linkColor: ColorScheme;

  buttons: {
    primary: ButtonTheme; // e.g., Send, New Chat
    secondary: ButtonTheme; // e.g., End Chat
    destructive: ButtonTheme; // e.g., Confirm End
    newMessages: ButtonTheme; // The "New Messages" button
  };

  overlays: {
    replyingPreview: {
      background: ColorScheme;
      border: ColorScheme;
      title: ColorScheme;
      description: ColorScheme;
      closeIcon: ColorScheme;
    };
    emojiMenu: {
      background: ColorScheme;
      shadow: string;
    };
  };

  animations: {
    typingIndicatorDots: ColorScheme;
  };
}
