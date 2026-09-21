import "server-only";
import { env } from "@/server/env";

/**
 * Logger estruturado (uma linha JSON por evento) com redação de segredos (docs/03, parte 29).
 * É o único lugar autorizado a usar `console`. Só depende de `server/env` (para o nível).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACTED = "[redacted]";
const MAX_DEPTH = 5;

// Nomes de chave cuja VALOR nunca deve ser logado (superconjunto de propósito).
const SENSITIVE_KEY =
  /pass(word|wd)?|senha|token|secret|authorization|cookie|api[-_]?key|dsn|credential|connection[-_]?string|database[-_]?url/i;
// usuario:senha@ dentro de URLs (postgres://user:senha@host).
const URL_CREDENTIALS = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)([^\s@/]+)(@)/gi;

function serializeError(
  error: Error,
  depth: number,
  seen: WeakSet<object>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: error.name,
    message: redact(error.message, depth + 1, seen),
  };
  if ("code" in error && typeof error.code === "string") out.code = error.code;
  if (error.stack) out.stack = redact(error.stack, depth + 1, seen);
  if (error.cause !== undefined) out.cause = redact(error.cause, depth + 1, seen);
  return out;
}

export function redact(value: unknown, depth = 0, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === "string") return value.replace(URL_CREDENTIALS, `$1${REDACTED}$3`);
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (value instanceof Error) return serializeError(value, depth, seen);
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1, seen));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1, seen);
  }
  return out;
}

type Sink = (level: LogLevel, line: string) => void;

const consoleSink: Sink = (level, line) => {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

type CreateLoggerOptions = {
  /** Nível fixo, ou função avaliada a cada evento (permite ler a configuração só quando usada). */
  level?: LogLevel | (() => LogLevel);
  bindings?: LogFields;
  sink?: Sink;
  now?: () => Date;
};

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const levelOption = options.level ?? "info";
  const currentLevel = () => (typeof levelOption === "function" ? levelOption() : levelOption);
  const bindings = options.bindings ?? {};
  const sink = options.sink ?? consoleSink;
  const now = options.now ?? (() => new Date());

  function write(at: LogLevel, message: string, fields?: LogFields) {
    if (ORDER[at] < ORDER[currentLevel()]) return;
    const entry = {
      ...(redact(bindings) as LogFields),
      ...(fields ? (redact(fields) as LogFields) : {}),
      time: now().toISOString(),
      level: at,
      msg: redact(message),
    };
    sink(at, JSON.stringify(entry));
  }

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
    child: (extra) =>
      createLogger({ level: levelOption, bindings: { ...bindings, ...extra }, sink, now }),
  };
}

/** Nível vindo de `LOG_LEVEL` (validado em `server/env`). Se a configuração for inválida, não
 * quebra o log: cai em "info" (o erro de configuração aparece onde `env()` é chamado). */
function levelFromEnv(): LogLevel {
  try {
    return env().LOG_LEVEL;
  } catch {
    return "info";
  }
}

/** Logger padrão da aplicação. O nível é lido na primeira vez em que um evento é emitido. */
export const logger: Logger = createLogger({ level: levelFromEnv });
