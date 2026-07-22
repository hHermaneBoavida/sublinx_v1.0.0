import React from "react";

export const AuthPrimaryButton = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="w-full h-14 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
    style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
  >
    {loading ? (
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60" />
      </svg>
    ) : children}
  </button>
);

export const AuthSecondaryButton = ({ children, icon: Icon, ...props }) => (
  <button
    {...props}
    className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98]"
    style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.15)" }}
  >
    {Icon && <Icon className="w-5 h-5" />}
    {children}
  </button>
);

export const AuthInput = React.forwardRef(({ icon: Icon, ...props }, ref) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
    <input
      ref={ref}
      {...props}
      className="pl-11 h-14 w-full rounded-2xl bg-[#121212] border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors px-4"
    />
  </div>
));

export const AuthContainer = ({ children }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-between py-16 px-6">
    {children}
  </div>
);

export const AuthFooter = ({ children }) => (
  <div className="text-center text-xs text-gray-700 max-w-xs">{children}</div>
);

export const AuthError = ({ message }) =>
  message ? (
    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
      {message}
    </div>
  ) : null;

export const AuthLink = ({ children, ...props }) => (
  <button
    {...props}
    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
  >
    {children}
  </button>
);