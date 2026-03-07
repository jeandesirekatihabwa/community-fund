export function Spinner({ className = "" }) {
    return (
        <svg
            className={`animate-spin h-5 w-5 text-indigo-600 ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );
}

export function Skeleton({ className = "" }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>;
}

export function Button({ type = "button", variant = "primary", className = "", isLoading, children, ...props }) {
    const baseStyle = "inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500",
        danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    };

    return (
        <button
            type={type}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Spinner className="mr-2 -ml-1 text-current" />}
            {children}
        </button>
    );
}

export function Card({ children, className = "" }) {
    return (
        <div className={`bg-white shadow overflow-hidden sm:rounded-lg ${className}`}>
            {children}
        </div>
    );
}
