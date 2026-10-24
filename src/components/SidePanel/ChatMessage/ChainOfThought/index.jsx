import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Brain, CaretRight } from "@phosphor-icons/react";

// Same component as the main app's ChainOfThought, sized down for the panel.
const cn = (...classes) => classes.filter(Boolean).join(" ");

const STEP_STATUS_STYLES = {
  complete: "text-zinc-400 light:text-zinc-500",
  active: "text-zinc-50 light:text-zinc-950",
  pending: "text-zinc-400/50 light:text-zinc-500/50",
};

const ChainOfThoughtContext = createContext(null);

const useChainOfThought = () => useContext(ChainOfThoughtContext);

/**
 * @param {Object} props
 * @param {boolean} [props.open] - controlled open state
 * @param {boolean} [props.defaultOpen] - uncontrolled initial open state
 * @param {(open: boolean) => void} [props.onOpenChange]
 */
export function ChainOfThought({
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const contentId = useId();

  const chainOfThoughtContext = useMemo(
    () => ({
      isOpen,
      contentId,
      setIsOpen: (next) => {
        setUncontrolledOpen(next);
        onOpenChange?.(next);
      },
    }),
    [isOpen, contentId, onOpenChange]
  );

  return (
    <ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
      <div className={cn("space-y-3", className)} {...props}>
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
}

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - leading indicator, defaults to a brain glyph
 * @param {boolean} [props.pending] - sweeps a shine across the label while work is in flight
 */
export function ChainOfThoughtHeader({
  className,
  icon,
  pending = false,
  children,
  ...props
}) {
  const { isOpen, setIsOpen, contentId } = useChainOfThought();

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "border-none bg-transparent p-0 flex w-full items-start gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-50 light:text-zinc-500 light:hover:text-zinc-950",
        className
      )}
      {...props}
    >
      {icon ?? <Brain className="size-4 flex-shrink-0 mt-0.5" />}
      <span
        className={cn(
          "min-w-0 break-words text-left",
          pending &&
            "animate-shimmer bg-[length:200%_100%] bg-clip-text text-transparent bg-[linear-gradient(90deg,theme(colors.zinc.500),theme(colors.zinc.100),theme(colors.zinc.500))] light:bg-[linear-gradient(90deg,theme(colors.zinc.400),theme(colors.zinc.900),theme(colors.zinc.400))]"
        )}
      >
        {children ?? "Thoughts"}
      </span>
      <CaretRight
        className={cn(
          "size-3 flex-shrink-0 mt-1 transition-transform",
          isOpen ? "rotate-90" : "rotate-0"
        )}
      />
    </button>
  );
}

/**
 * @param {Object} props
 * @param {React.ElementType} [props.icon] - marker icon, defaults to a dot
 * @param {React.ReactNode} props.label
 * @param {React.ReactNode} [props.description]
 * @param {"complete" | "active" | "pending"} [props.status]
 */
export const ChainOfThoughtStep = memo(function ChainOfThoughtStep({
  className,
  icon: Icon,
  label,
  description,
  status = "complete",
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-2 text-sm",
        STEP_STATUS_STYLES[status],
        "fade-in-0 slide-in-from-top-2 animate-in",
        className
      )}
      {...props}
    >
      {/* Rail to the next marker; the offset reaches past the gap between steps. */}
      <div className="absolute left-[7.5px] top-[15px] bottom-[calc(-0.75rem-6.5px)] w-px bg-zinc-800 group-last:hidden light:bg-zinc-200" />
      <div className="relative flex h-5 w-4 flex-shrink-0 items-center justify-center">
        {Icon ? (
          <Icon className="size-4" />
        ) : (
          <span className="size-[7px] rounded-full bg-current opacity-60" />
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden break-words">
        <div>{label}</div>
        {description && (
          <div className="text-xs text-zinc-400 light:text-zinc-500">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
});

export function ChainOfThoughtContent({ className, children, ...props }) {
  const { isOpen, contentId } = useChainOfThought();
  const [isPresent, setIsPresent] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setIsPresent(true);
  }, [isOpen]);

  if (!isPresent) return null;

  return (
    <div
      id={contentId}
      data-state={isOpen ? "open" : "closed"}
      // Keeps closed content mounted until its exit animation finishes.
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget || isOpen) return;
        setIsPresent(false);
      }}
      className={cn(
        "mt-2 space-y-3",
        "text-zinc-50 outline-none light:text-zinc-950 data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
