import React from "react";

interface LoadingSpinnerProps {
  color?: "blue" | "red" | "green" | "yellow" | "gray" | "white";
  size?: "4" | "5" | "6" | "8" | "10" | "12";
  inline?: boolean;
  className?: string;
}

const sizeMap: Record<"4" |"5" | "6" | "8" | "10" | "12", string> = {
  "4": "w-4 h-4",
  "5" :"w-5 h-5",
  "6": "w-6 h-6",
  "8": "w-8 h-8",
  "10": "w-10 h-10",
  "12": "w-12 h-12",
};

const colorMap: Record<
  "blue" | "red" | "green" | "yellow" | "gray" | "white",
  string
> = {
  blue: "border-blue-500",
  red: "border-red-500",
  green: "border-green-500",
  yellow: "border-yellow-500",
  gray: "border-gray-500",
  white: "border-white",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  color = "blue",
  size = "4",
  inline = false,
  className = "",
}) => {
  const spinner = (
    <div
      className={`${sizeMap[size as keyof typeof sizeMap] || sizeMap["8"]}
        border-3 
        ${colorMap[color as keyof typeof colorMap] || colorMap["blue"]} 
        border-t-transparent 
        rounded-full 
        animate-spin 
        ${className}`}
    />
  );

  return inline ? (
    spinner
  ) : (
    <div className="flex justify-center items-center h-32">{spinner}</div>
  );
};

export default LoadingSpinner;
