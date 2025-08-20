
import React from "react";

interface ActionButtonProps {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "ghost";
  icon?: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  onClick, 
  variant = "secondary", 
  icon: Icon, 
  disabled = false,
  className = ""
}) => {
  const baseClasses = disabled 
    ? "opacity-50 cursor-not-allowed" 
    : "hover:scale-105 active:scale-95 transition-all duration-200";
  
  const variantClasses: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    ghost: "btn-ghost"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${baseClasses} ${className} flex items-center gap-2`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
export default ActionButton;