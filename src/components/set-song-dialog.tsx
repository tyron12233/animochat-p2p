import React, { useState } from 'react';
import { ChatThemeV2 } from '../lib/chat-theme';

interface SetSongDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSong: (name: string, url: string) => void;
  theme: ChatThemeV2;
  mode: 'light' | 'dark';
}

/**
 * A dialog component for admins to set a new song for the shared music player.
 * @param {SetSongDialogProps} props The props for the component.
 * @returns {JSX.Element | null} The rendered dialog or null if not open.
 */
const SetSongDialog: React.FC<SetSongDialogProps> = ({ isOpen, onClose, onSetSong, theme, mode }) => {
  const [songName, setSongName] = useState('');
  const [songUrl, setSongUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (songName.trim() && songUrl.trim()) {
      onSetSong(songName, songUrl);
      onClose(); // Close the dialog after submission
      setSongName(''); // Reset fields
      setSongUrl('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        style={{
          background: theme.general.background[mode],
          color: theme.secondaryText[mode],
        }}
        className="p-6 rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 
          style={{ color: theme.header.statusValue[mode] }}
          className="text-lg font-semibold mb-4"
        >
          Set a New Song
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="songName" className="block text-sm font-medium mb-1">
              Song Name
            </label>
            <input
              id="songName"
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              style={{
                background: theme.inputArea.background[mode],
                color: theme.inputArea.inputText[mode],
                borderColor: theme.inputArea.border[mode],
              }}
              className="w-full p-2 border rounded-md focus:ring-2"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="songUrl" className="block text-sm font-medium mb-1">
              Song URL (MP3)
            </label>
            <input
              id="songUrl"
              type="url"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              style={{
                background: theme.inputArea.background[mode],
                color: theme.inputArea.inputText[mode],
                borderColor: theme.inputArea.border[mode],
              }}
              className="w-full p-2 border rounded-md focus:ring-2"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{
                background: theme.buttons.secondary.background[mode],
                color: theme.buttons.secondary.text[mode],
              }}
              className="px-4 py-2 rounded-md font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: theme.buttons.primary.background[mode],
                color: theme.buttons.primary.text[mode],
              }}
              className="px-4 py-2 rounded-md font-semibold"
            >
              Set Song
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetSongDialog;