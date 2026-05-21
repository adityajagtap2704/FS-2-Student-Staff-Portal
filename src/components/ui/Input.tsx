"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className = "", id, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <motion.label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#444]"
            animate={{ color: focused ? "#1D9E75" : "#444444" }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {icon && (
            <motion.div
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              animate={{ color: focused ? "#1D9E75" : "#9ca3af" }}
              transition={{ duration: 0.15 }}
            >
              {icon}
            </motion.div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            animate={{
              boxShadow: focused
                ? "0 0 0 3px rgba(29,158,117,0.12)"
                : "0 1px 2px rgba(0,0,0,0.04)",
              borderColor: error
                ? "#fca5a5"
                : focused
                ? "#1D9E75"
                : "#e5e7eb",
            }}
            transition={{ duration: 0.15 }}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={`
              w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#444]
              placeholder:text-gray-300
              focus:outline-none
              disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400
              ${icon ? "pl-10" : ""}
              ${iconRight ? "pr-10" : ""}
              ${className}
            `}
            {...(props as React.ComponentProps<typeof motion.input>)}
          />
          {iconRight && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {iconRight}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-red-500 flex items-center gap-1"
              role="alert"
            >
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, icon, className = "", id, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <motion.label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#444]"
            animate={{ color: focused ? "#1D9E75" : "#444444" }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {icon && (
            <motion.div
              className="absolute left-3.5 top-3 pointer-events-none"
              animate={{ color: focused ? "#1D9E75" : "#9ca3af" }}
              transition={{ duration: 0.15 }}
            >
              {icon}
            </motion.div>
          )}
          <motion.textarea
            ref={ref}
            id={inputId}
            animate={{
              boxShadow: focused
                ? "0 0 0 3px rgba(29,158,117,0.12)"
                : "0 1px 2px rgba(0,0,0,0.04)",
              borderColor: error ? "#fca5a5" : focused ? "#1D9E75" : "#e5e7eb",
            }}
            transition={{ duration: 0.15 }}
            onFocus={(e) => { setFocused(true); onFocus?.(e as React.FocusEvent<HTMLTextAreaElement>); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e as React.FocusEvent<HTMLTextAreaElement>); }}
            className={`
              w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#444]
              placeholder:text-gray-300 resize-none
              focus:outline-none
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${icon ? "pl-10" : ""}
              ${className}
            `}
            {...(props as React.ComponentProps<typeof motion.textarea>)}
          />
        </div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-red-500 flex items-center gap-1"
              role="alert"
            >
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Input;
