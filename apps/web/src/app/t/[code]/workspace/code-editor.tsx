"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, type RefObject } from "react";
import { Skeleton } from "@/components/ui/feedback";

export type MonacoEditor = Parameters<OnMount>[0];

export type EditorTheme = "dark" | "light";

const MONACO_THEME: Record<EditorTheme, string> = { dark: "vs-dark", light: "light" };
const LINE_BREAK = /\r\n?/g;

const normalize = (text: string) => text.replace(LINE_BREAK, "\n");

function selectedText(editor: MonacoEditor) {
  const model = editor.getModel();
  if (!model) return "";
  return (editor.getSelections() ?? []).map((s) => model.getValueInRange(s)).join(model.getEOL());
}

function guardClipboard(
  editor: MonacoEditor,
  clipboard: RefObject<string>,
  onPasteBlocked: (chars: number) => void,
) {
  const node = editor.getContainerDomNode();
  const fromEditor = (e: Event) => e.target instanceof Node && node.contains(e.target);
  const remember = (e: ClipboardEvent) => {
    if (fromEditor(e)) clipboard.current = normalize(selectedText(editor));
  };
  const blockForeignPaste = (e: ClipboardEvent) => {
    if (!fromEditor(e)) return;
    const text = normalize(e.clipboardData?.getData("text/plain") ?? "");
    if (text === "" || text === clipboard.current) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    onPasteBlocked(text.length);
  };
  const blockDrop = (e: DragEvent) => {
    if (!fromEditor(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const listeners = [
    ["copy", remember],
    ["cut", remember],
    ["paste", blockForeignPaste],
    ["drop", blockDrop],
  ] as const;
  for (const [type, listener] of listeners) window.addEventListener(type, listener as EventListener, true);
  return () => {
    for (const [type, listener] of listeners) window.removeEventListener(type, listener as EventListener, true);
  };
}

export function CodeEditor({
  path,
  language,
  defaultValue,
  fontSize,
  theme,
  blockPaste,
  readOnly,
  clipboard,
  editorRef,
  onChange,
  onEdit,
  onPasteBlocked,
}: {
  path: string;
  language: string;
  defaultValue: string;
  fontSize: number;
  theme: EditorTheme;
  blockPaste: boolean;
  readOnly: boolean;
  clipboard: RefObject<string>;
  editorRef: RefObject<MonacoEditor | null>;
  onChange: (value: string) => void;
  onEdit: (insertedLines: number, chars: number) => void;
  onPasteBlocked: (chars: number) => void;
}) {
  const handlers = useRef({ onEdit, onPasteBlocked });

  useEffect(() => {
    handlers.current = { onEdit, onPasteBlocked };
  }, [onEdit, onPasteBlocked]);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    const content = editor.onDidChangeModelContent((e) => {
      if (e.isFlush) return;
      const chars = e.changes.reduce((sum, c) => sum + c.text.length, 0);
      const insertedLines = e.changes.reduce((sum, c) => sum + c.text.split("\n").length - 1, 0);
      handlers.current.onEdit(insertedLines, chars);
    });
    const unguard = blockPaste
      ? guardClipboard(editor, clipboard, (chars) => handlers.current.onPasteBlocked(chars))
      : undefined;
    editor.onDidDispose(() => {
      content.dispose();
      unguard?.();
    });
  };

  return (
    <Editor
      path={path}
      language={language}
      defaultValue={defaultValue}
      theme={MONACO_THEME[theme]}
      onMount={onMount}
      onChange={(value) => onChange(value ?? "")}
      loading={<Skeleton className="m-4 h-40 w-[calc(100%-2rem)]" />}
      options={{
        fontSize,
        readOnly,
        fontFamily: "var(--font-jetbrains), monospace",
        fontLigatures: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        contextmenu: !blockPaste,
        emptySelectionClipboard: false,
        dragAndDrop: true,
        dropIntoEditor: { enabled: false },
        inlineSuggest: { enabled: false },
        padding: { top: 12 },
      }}
    />
  );
}
