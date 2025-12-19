// components/FormInput.tsx
"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  label: string;
  name: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  type?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  autoComplete?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  wrapperClassName?: string;
}

/* ===================== TEXT INPUT ===================== */
export const CustomTextInput: React.FC<InputProps> = ({
  label,
  name,
  icon: Icon,
  type = "text",
  required,
  error,
  value,
  onChange,
  register,
  autoComplete,
  inputProps,
  wrapperClassName,
}) => {
  const hasIcon = !!Icon;

  return (
    <div className={["relative group", wrapperClassName].filter(Boolean).join(" ")}>
      {/* Icon: default xám, chỉ xanh khi focus */}
      {hasIcon && (
        <div
          className="
            absolute inset-y-0 left-3 flex items-center
            text-gray-400 transition-colors duration-200
            group-focus-within:text-sky-600
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        autoCapitalize="off"
        spellCheck={false}
        aria-invalid={!!error}
        {...inputProps}
        {...register}
        className={[
          "peer w-full border-2 rounded-lg bg-gray-50/40 focus:bg-white text-sm transition-all outline-none",
          hasIcon ? "pl-12 pr-3 py-3.5" : "px-4 py-3.5", // 12 + 20 + 2
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-400"
            : "border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-400/10 hover:border-sky-500/30",
          "placeholder-transparent",
        ].join(" ")}
      />

      {/* Label nổi, nền che viền */}
      <label
        htmlFor={name}
        className={[
          "absolute pointer-events-none transition-all",
          "top-1/2 -translate-y-1/2 text-sm text-gray-500",
          hasIcon ? "left-10" : "left-3",
          "peer-focus:top-0 peer-focus:-translate-y-2.5 peer-focus:text-xs peer-focus:text-sky-600",
          "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-2.5 peer-not-placeholder-shown:text-xs",
          "peer-focus:left-6 peer-not-placeholder-shown:left-6",
          "px-1 bg-gray-50 peer-focus:bg-white peer-not-placeholder-shown:bg-white",
          error ? "text-red-600 peer-focus:text-red-600" : "",
        ].join(" ")}
      >
        {label}
      </label>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

/* ===================== PASSWORD INPUT ===================== */
export const CustomPasswordInput: React.FC<InputProps> = ({
  label,
  name,
  icon: Icon,
  required,
  error,
  value,
  onChange,
  register,
  autoComplete,
  inputProps,
  wrapperClassName,
}) => {
  const [show, setShow] = useState(false);
  const hasIcon = !!Icon;

  return (
    <div className={["relative group", wrapperClassName].filter(Boolean).join(" ")}>
      {hasIcon && (
        <div
          className="
            absolute inset-y-0 left-3 flex items-center
            text-gray-400 transition-colors duration-200
            group-focus-within:text-sky-600
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      <input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        required={required}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete || "current-password"}
        autoCapitalize="off"
        spellCheck={false}
        aria-invalid={!!error}
        {...inputProps}
        {...register}
        className={[
          "peer w-full border-2 rounded-lg bg-gray-50/40 focus:bg-white text-sm transition-all outline-none",
          hasIcon ? "pl-12 pr-10 py-3.5" : "pl-4 pr-10 py-3.5",
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-400"
            : "border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-400/10 hover:border-sky-500/30",
          "placeholder-transparent",
        ].join(" ")}
      />

      {/* nút show/hide: có thể để xám, không đổi màu khi hover */}
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        onMouseDown={e => e.preventDefault()}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        tabIndex={-1}
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>

      <label
        htmlFor={name}
        className={[
          "absolute pointer-events-none transition-all",
          "top-1/2 -translate-y-1/2 text-sm text-gray-500",
          hasIcon ? "left-10" : "left-3",
          "peer-focus:top-0 peer-focus:-translate-y-2.5 peer-focus:text-xs peer-focus:text-sky-600",
          "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-2.5 peer-not-placeholder-shown:text-xs",
          "peer-focus:left-6 peer-not-placeholder-shown:left-6",
          "px-1 bg-gray-50 peer-focus:bg-white peer-not-placeholder-shown:bg-white",
          error ? "text-red-600 peer-focus:text-red-600" : "",
        ].join(" ")}
      >
        {label}
      </label>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};
