import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 disabled:bg-gray-300",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-300",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 disabled:bg-yellow-300",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 disabled:text-gray-400",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;
