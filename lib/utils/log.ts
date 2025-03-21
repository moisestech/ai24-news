const logLevel = process.env.LOG_LEVEL;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogPrefix = string;

interface DevLogOptions {
  level?: LogLevel;
  prefix?: LogPrefix;
  timestamp?: boolean;
}

// Add a configuration object to control logging
const LOG_CONFIG = {
  enabledPrefixes: process.env.NEXT_PUBLIC_ENABLED_LOG_PREFIXES?.split(',') || [
    '*',
  ],
  disabledPrefixes:
    process.env.NEXT_PUBLIC_DISABLED_LOG_PREFIXES?.split(',') || [],
  minLevel: (process.env.NEXT_PUBLIC_MIN_LOG_LEVEL as LogLevel) || 'info',
  // Map log levels to numeric values for comparison
  logLevelSeverity: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
};

// Helper function to check if logging is enabled for a prefix
const shouldLog = (prefix: string = '', level: LogLevel = 'info'): boolean => {
  // Always log errors regardless of prefix settings
  if (level === 'error') return true;

  // Check if prefix is explicitly disabled
  if (LOG_CONFIG.disabledPrefixes.includes(prefix)) return false;

  // Check if prefix is explicitly enabled or if we're using wildcard
  const prefixEnabled =
    LOG_CONFIG.enabledPrefixes.includes('*') ||
    LOG_CONFIG.enabledPrefixes.includes(prefix);

  // Check if log level meets minimum severity
  const levelEnabled =
    LOG_CONFIG.logLevelSeverity[level] >=
    LOG_CONFIG.logLevelSeverity[LOG_CONFIG.minLevel];

  return prefixEnabled && levelEnabled;
};

export const devAlert = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    if (logLevel === 'debug') {
      alert(args.join(' '));
    } else if (logLevel === 'verbose') {
      console.log(JSON.stringify(args, null, 2));
    } else {
      console.log(JSON.stringify({ logLevel, args }));
    }
  }
};

export const devLog = (
  message: any,
  options?: DevLogOptions | LogPrefix,
  ...args: any[]
) => {
  if (process.env.NODE_ENV === 'production') return;

  // Handle case where options is just a string prefix
  const opts: DevLogOptions =
    typeof options === 'string' ? { prefix: options } : options || {};

  const { level = 'info', prefix = '', timestamp = true } = opts;

  // Check if this log should be shown
  if (!shouldLog(prefix, level)) return;

  const time = timestamp ? `[${new Date().toISOString()}]` : '';
  const tag = prefix ? `[${prefix}]` : '';

  // Color coding for different log levels
  const styles = {
    debug: 'color: #9B9B9B', // gray
    info: 'color: #2196F3', // blue
    warn: 'color: #FFC107', // yellow
    error: 'color: #F44336', // red
  };

  // Build the prefix string
  const prefixString = `%c${time}${tag}`;

  // Log with appropriate console method and styling
  switch (level) {
    case 'debug':
      console.debug(prefixString, styles.debug, message, ...args);
      break;
    case 'warn':
      console.warn(prefixString, styles.warn, message, ...args);
      break;
    case 'error':
      console.error(prefixString, styles.error, message, ...args);
      break;
    default:
      console.log(prefixString, styles.info, message, ...args);
  }
};