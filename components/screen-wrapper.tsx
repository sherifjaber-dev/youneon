"use client";

interface ScreenWrapperProps {
  children: React.ReactNode;
  padBottom?: boolean;
}

export function ScreenWrapper({ children, padBottom = true }: ScreenWrapperProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 ${padBottom ? "pb-24" : ""}`}>
      {children}
    </div>
  );
}
