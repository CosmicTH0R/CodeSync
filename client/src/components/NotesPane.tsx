import React, { useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

// Themes
import { dracula } from "@uiw/codemirror-theme-dracula";
import { githubLight } from "@uiw/codemirror-theme-github";

interface NotesPaneProps {
  yNotes: Y.Text;
  awareness: Awareness;
  theme: "light" | "dark";
}

const defaultNotes = `
# My Private Notes
- Collaborative notes synced via Yjs
`;

const NotesPane: React.FC<NotesPaneProps> = ({ yNotes, awareness, theme }) => {
  const yjsExtension = yCollab(yNotes, awareness);

  // CM Theme
  const themeExtension = theme === "dark" ? dracula : githubLight;

  useEffect(() => {
    if (yNotes.toString().trim().length === 0) {
      yNotes.insert(0, defaultNotes);
    }
  }, [yNotes]);

  return (
    <div
      className="
        w-full h-full 
        bg-white dark:bg-[#101010]
        p-3
      "
    >
      <div
        className="
          h-full 
          border border-gray-300 dark:border-gray-700
          rounded-md 
          overflow-hidden
          bg-white dark:bg-[#181818]
        "
      >
        <CodeMirror
          height="100%"
          extensions={[javascript({ jsx: true }), yjsExtension, themeExtension]}
        />
      </div>
    </div>
  );
};

export default NotesPane;
