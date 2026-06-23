import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let _nextId = 0;

function reducer(state, action) {
  if (action.type === 'add')    return [...state, action.toast];
  if (action.type === 'remove') return state.filter(t => t.id !== action.id);
  return state;
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const remove = useCallback(id => dispatch({ type: 'remove', id }), []);
  const add = useCallback((message, type) => {
    const id = ++_nextId;
    dispatch({ type: 'add', toast: { id, message, type } });
  }, []);

  const toast = {
    success: msg => add(msg, 'success'),
    error:   msg => add(msg, 'error'),
    warning: msg => add(msg, 'warning'),
    info:    msg => add(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const DURATION = 3500;

const META = {
  success: { Icon: CheckCircle2, cls: 'text-leaf border-leaf/20 bg-white',  bar: 'bg-leaf'  },
  error:   { Icon: AlertCircle,   cls: 'text-coral border-coral/20 bg-white', bar: 'bg-coral' },
  warning: { Icon: AlertTriangle, cls: 'text-amber border-amber/20 bg-white', bar: 'bg-amber' },
  info:    { Icon: Info,           cls: 'text-ink border-border bg-white',     bar: 'bg-slate2'},
};

function ToastItem({ toast: t, onRemove }) {
  const { Icon, cls, bar } = META[t.type] ?? META.info;
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(t.id), DURATION);
    return () => clearTimeout(timerRef.current);
  }, [t.id, onRemove]);

  return (
    <div
      role="alert"
      className={`toast-item relative flex items-start gap-2.5 rounded-xl border shadow-lift px-3.5 py-3 pr-9 overflow-hidden cursor-pointer select-none ${cls}`}
      onClick={() => onRemove(t.id)}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="text-sm font-semibold leading-snug">{t.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute right-2 top-2 p-1 rounded opacity-40 hover:opacity-80 transition-opacity"
        onClick={e => { e.stopPropagation(); onRemove(t.id); }}
      >
        <X className="h-3 w-3" />
      </button>
      <div className={`absolute bottom-0 left-0 h-0.5 ${bar} toast-bar`} />
    </div>
  );
}

function Toaster({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div
      className="fixed z-[200] flex flex-col gap-2 w-full px-4 sm:px-0 sm:w-80 pointer-events-none"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))', right: 0, paddingRight: '1rem' }}
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
