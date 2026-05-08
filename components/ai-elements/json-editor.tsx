"use client";

import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, lineNumbers } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type JsonEditorProps = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  "data-testid"?: string;
};

function PureJsonEditor({
  value,
  onChange,
  className,
  "data-testid": testId,
}: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  // Keep the latest onChange in a ref so the editor is mounted exactly once
  // — re-mounting on every prop change would lose focus and selection state.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [basicSetup, lineNumbers(), json(), oneDark, updateListener],
      }),
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
    // We intentionally only mount the editor once. Subsequent value updates
    // are synced via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External value changes (e.g. reopening the panel) sync into the editor.
  useEffect(() => {
    const view = editorRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-input bg-input/30 font-mono text-[12px] [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:font-mono",
        className
      )}
      data-mcp-value={value}
      data-testid={testId}
      ref={containerRef}
    />
  );
}

export const JsonEditor = memo(PureJsonEditor);
