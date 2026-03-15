export function Spinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 text-indigo-600 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// Premium Button with mobile-first logic
export function Button({
  type = "button",
  variant = "primary",
  className = "",
  isLoading = false,
  children,
  disabled,
  ...props
}) {
  const baseStyle =
    "relative inline-flex justify-center items-center px-6 py-4 border-0 text-sm font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-none";

  const variants = {
    primary:
      "text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:shadow-sm",
    secondary:
      "text-slate-600 bg-white border border-slate-100 hover:bg-slate-50 shadow-sm",
    danger:
      "text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 -ml-1 text-current shrink-0" />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// Premium Card for Mobile Surfaces
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-[2rem] border border-white/50 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}