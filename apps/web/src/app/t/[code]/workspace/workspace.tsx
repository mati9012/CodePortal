"use client";

import type { EventsResult, Language, StudentProblem } from "@codeportal/contracts";
import { AlignLeft, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyedMutator } from "swr";
import { LogoMark } from "@/components/brand/logo";
import { ProblemTiles } from "@/components/exam/score";
import { AutosaveStatus, Timer, type AutosaveState } from "@/components/exam/timer";
import { useToast } from "@/components/panel/use-toast";
import { Button, IconButton } from "@/components/ui/button";
import { Banner, OfflineIcon, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { sessionCall, type LiveSession } from "@/lib/exam-session";
import { LANGUAGE_LABEL } from "@/lib/panel-labels";
import { useNow } from "@/lib/use-now";
import { enterFullscreen, useIsFullscreen } from "../fullscreen";
import { BottomPanel } from "./bottom-panel";
import { CodeEditor, type EditorTheme, type MonacoEditor } from "./code-editor";
import { FinishDialog } from "./finish-dialog";
import {
  FullscreenExitModal,
  NoticeModal,
  TeacherEndedModal,
  TimeUpModal,
  WaitingModal,
} from "./overlays";
import { problemTiles } from "./problem-status";
import { Statement } from "./statement";
import { languageKeys, payload, useExamCode, type SaveState } from "./use-exam-code";
import { useTelemetry } from "./use-telemetry";

const SECOND_MS = 1000;
const LAST_MINUTES_SEC = 5 * 60;
const FONT_SIZE = { min: 11, default: 14, max: 22 };
const FORMATTABLE = new Set(["html", "css", "javascript"]);

const MONACO_LANGUAGE: Record<string, string> = {
  py: "python",
  cpp: "cpp",
  java: "java",
  cs: "csharp",
  js: "javascript",
  php: "php",
  html: "html",
  css: "css",
};

const monacoLanguageOf = (path: string) => MONACO_LANGUAGE[path.split(".").at(-1) ?? ""] ?? "plaintext";

const languageLabel = (key: string) =>
  key
    .split("+")
    .map((l) => LANGUAGE_LABEL[l as Language] ?? l)
    .join(" + ");

function autosaveState(save: SaveState, now: number): AutosaveState | null {
  if (save.kind === "idle") return null;
  if (save.kind === "saved") return { kind: "saved", secondsAgo: Math.max(0, Math.round((now - save.at) / SECOND_MS)) };
  return save;
}

type WorkspaceProps = {
  session: LiveSession;
  token: string;
  refresh: KeyedMutator<LiveSession>;
  offline: boolean;
  onLeave: () => void;
};

export function Workspace(props: WorkspaceProps) {
  if (props.session.problems.length === 0)
    return (
      <div data-theme="dark" className="flex h-dvh flex-col gap-4 bg-canvas p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="flex-1" />
      </div>
    );
  return <ActiveWorkspace {...props} />;
}

function ActiveWorkspace({ session, token, refresh, offline, onLeave }: WorkspaceProps) {
  const { exam, problems } = session;
  const finished = session.phase === "finished";
  const [theme, setTheme] = useState<EditorTheme>("dark");
  const [activeNumber, setActiveNumber] = useState(problems[0]!.number);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(FONT_SIZE.default);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seenNotices, setSeenNotices] = useState(() => new Set(session.notices.map((n) => n.id)));
  const clipboard = useRef("");
  const editorRef = useRef<MonacoEditor | null>(null);
  const { show, toast } = useToast();
  const fullscreen = useIsFullscreen();
  const now = useNow();
  const code = useExamCode(token);

  const problem = problems.find((p) => p.number === activeNumber) ?? problems[0]!;
  const current = code.codeOf(problem);
  const files = current.byLanguage[current.language] ?? [];
  const file = files.find((f) => f.path === activeFile) ?? files[0]!;
  const fileLanguage = monacoLanguageOf(file.path);
  const deadline = session.deadlineAt ? Date.parse(session.deadlineAt) : 0;
  const secondsLeft = now ? (deadline - now - session.clockOffsetMs) / SECOND_MS : Infinity;
  const timeUp = secondsLeft <= 0;
  const locked = finished || session.waitingForDecision || timeUp;
  const pendingNotice = session.notices.find((n) => !seenNotices.has(n.id));
  const connectionLost = offline || code.save.kind === "offline";

  const onEventsResult = useCallback(
    (result: EventsResult) => {
      if (
        result.waitingForDecision !== session.waitingForDecision ||
        result.fullscreenExitsUsed !== session.fullscreenExitsUsed
      )
        void refresh();
    },
    [refresh, session.fullscreenExitsUsed, session.waitingForDecision],
  );
  const { record, recordEdit } = useTelemetry(token, onEventsResult);

  useEffect(() => {
    if (!exam.fullscreen || finished) return;
    const onChange = () => {
      if (!document.fullscreenElement) record("fullscreen_exit");
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [exam.fullscreen, finished, record]);

  useEffect(() => {
    if (finished) return;
    let leftAt: number | null = null;
    const onLeaveWindow = () => {
      leftAt ??= Date.now();
    };
    const onReturn = () => {
      if (leftAt === null) return;
      record("blur", { durationMs: Date.now() - leftAt });
      leftAt = null;
    };
    const onVisibility = () => (document.hidden ? onLeaveWindow() : onReturn());
    window.addEventListener("blur", onLeaveWindow);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onLeaveWindow);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [finished, record]);

  const { flush } = code;
  useEffect(() => {
    if (timeUp && !finished) void flush().finally(() => refresh());
  }, [timeUp, finished, flush, refresh]);

  useEffect(() => {
    if (finished && session.finishReason === "student") onLeave();
  }, [finished, session.finishReason, onLeave]);

  const selectProblem = (number: number) => {
    setActiveNumber(number);
    setActiveFile(null);
  };

  const submit = async (target: StudentProblem) => {
    setSubmitting(true);
    try {
      await code.flush();
      await sessionCall(token, "/submit", payload(target.id, code.codeOf(target)));
      await refresh();
      show("Zgłoszono rozwiązanie", `Zadanie ${target.number} czeka na ocenę.`);
    } catch (error) {
      show("Nie udało się zgłosić", errorMessage(error), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await code.flush();
      await sessionCall(token, "/finish", undefined, "POST");
      await refresh();
    } catch (error) {
      show("Nie udało się zakończyć testu", errorMessage(error), "danger");
      setFinishing(false);
    }
  };

  const saveStatus = autosaveState(code.save, now);

  return (
    <div data-theme={theme} className="flex h-dvh flex-col bg-canvas text-ink max-lg:h-auto max-lg:min-h-dvh">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark size={28} />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-semibold text-ink">{exam.title}</p>
            <p className="truncate text-xs text-ink-2">
              {[exam.group, exam.teacher, session.name].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <ProblemTiles
          problems={problemTiles(problems)}
          activeNumber={problem.number}
          onSelect={selectProblem}
          showMax
        />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {saveStatus && <AutosaveStatus state={saveStatus} />}
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <span className={cn("size-2 rounded-full", connectionLost ? "bg-danger" : "bg-success")} aria-hidden />
            {connectionLost ? "Brak połączenia" : "Połączono"}
          </span>
          {session.deadlineAt && <Timer secondsLeft={Number.isFinite(secondsLeft) ? secondsLeft : 0} />}
          <IconButton
            label={theme === "dark" ? "Jasny motyw" : "Ciemny motyw"}
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </IconButton>
          <Button variant="secondary" onClick={() => setFinishOpen(true)} disabled={finished}>
            Zakończ test
          </Button>
        </div>
      </header>

      {(connectionLost || (secondsLeft > 0 && secondsLeft <= LAST_MINUTES_SEC)) && (
        <div className="flex flex-col gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
          {connectionLost && (
            <Banner tone="danger" icon={OfflineIcon} title="Brak połączenia.">
              Pracuj dalej – kod zapisze się, gdy połączenie wróci. Czas testu płynie.
            </Banner>
          )}
          {secondsLeft > 0 && secondsLeft <= LAST_MINUTES_SEC && (
            <Banner tone="warning" title={`Zostało ${Math.ceil(secondsLeft / 60)} min.`}>
              Zgłoś rozwiązania, które chcesz oddać. Po czasie zgłosimy ostatnie wersje automatycznie.
            </Banner>
          )}
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.4fr)]">
        <aside className="min-h-0 overflow-y-auto border-line bg-surface lg:border-r">
          <Statement problem={problem} total={problems.length} />
        </aside>
        <section className="grid min-h-[80dvh] grid-rows-[auto_minmax(0,1fr)_minmax(200px,34%)] lg:min-h-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
            <Select
              aria-label="Język"
              value={current.language}
              onChange={(e) => {
                code.setLanguage(problem, e.target.value);
                setActiveFile(null);
              }}
              disabled={locked}
              className="h-8 w-auto text-[13px]"
            >
              {languageKeys(problem).map((key) => (
                <option key={key} value={key}>
                  {languageLabel(key)}
                </option>
              ))}
            </Select>
            <div role="tablist" aria-label="Pliki" className="flex flex-wrap gap-1">
              {files.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  role="tab"
                  aria-selected={f.path === file.path}
                  onClick={() => setActiveFile(f.path)}
                  className={cn(
                    "h-7 rounded-tag px-2 font-mono text-xs",
                    f.path === file.path ? "bg-subtle text-ink" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {f.path}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<AlignLeft />}
                disabled={locked || !FORMATTABLE.has(fileLanguage)}
                title={FORMATTABLE.has(fileLanguage) ? "Formatuj kod" : "Formatowanie działa dla HTML, CSS i JavaScript"}
                onClick={() => void editorRef.current?.getAction("editor.action.formatDocument")?.run()}
              >
                Formatuj
              </Button>
              <IconButton
                label="Mniejsza czcionka"
                size="sm"
                disabled={fontSize <= FONT_SIZE.min}
                onClick={() => setFontSize((s) => s - 1)}
              >
                A−
              </IconButton>
              <span className="w-10 text-center font-mono text-xs text-ink-2">{fontSize} px</span>
              <IconButton
                label="Większa czcionka"
                size="sm"
                disabled={fontSize >= FONT_SIZE.max}
                onClick={() => setFontSize((s) => s + 1)}
              >
                A+
              </IconButton>
            </div>
          </div>
          <div className="min-h-0 bg-surface">
            <CodeEditor
              path={`file:///${problem.id}/${current.language}/${file.path}`}
              language={fileLanguage}
              defaultValue={file.content}
              fontSize={fontSize}
              theme={theme}
              blockPaste={exam.blockPaste}
              readOnly={locked}
              clipboard={clipboard}
              editorRef={editorRef}
              onChange={(value) => code.setFile(problem, file.path, value)}
              onEdit={(lines, chars) => recordEdit(problem.id, lines, chars)}
              onPasteBlocked={(chars) => {
                record("paste_blocked", { chars, problemId: problem.id });
                show(
                  "Wklejanie z zewnątrz jest wyłączone",
                  "Próba została zapisana w przebiegu pracy. Kopiowanie we własnym kodzie działa.",
                  "warning",
                );
              }}
            />
          </div>
          <BottomPanel problem={problem} submitting={submitting} locked={locked} onSubmit={() => void submit(problem)} />
        </section>
      </div>

      <FinishDialog
        open={finishOpen && !finished}
        problems={problems}
        lastEditAt={code.lastEditAt}
        secondsLeft={Math.max(0, secondsLeft)}
        finishing={finishing}
        onClose={() => setFinishOpen(false)}
        onFinish={() => void finish()}
      />
      {toast}
      <BlockingLayer
        session={session}
        fullscreen={fullscreen}
        pendingNotice={pendingNotice}
        onNoticeSeen={(id) => setSeenNotices((seen) => new Set(seen).add(id))}
        onLeave={onLeave}
      />
    </div>
  );
}

function BlockingLayer({
  session,
  fullscreen,
  pendingNotice,
  onNoticeSeen,
  onLeave,
}: {
  session: LiveSession;
  fullscreen: boolean;
  pendingNotice: LiveSession["notices"][number] | undefined;
  onNoticeSeen: (id: string) => void;
  onLeave: () => void;
}) {
  if (session.phase === "finished") {
    if (session.finishReason === "teacher") return <TeacherEndedModal onContinue={onLeave} />;
    if (session.finishReason === "time") return <TimeUpModal onContinue={onLeave} />;
    return null;
  }
  if (session.waitingForDecision) return <WaitingModal />;
  if (session.exam.fullscreen && !fullscreen)
    return (
      <FullscreenExitModal
        used={session.fullscreenExitsUsed}
        limit={session.exam.fullscreenExits}
        onReturn={() => void enterFullscreen()}
      />
    );
  if (pendingNotice)
    return <NoticeModal notice={pendingNotice} deadlineAt={session.deadlineAt} onClose={() => onNoticeSeen(pendingNotice.id)} />;
  return null;
}
