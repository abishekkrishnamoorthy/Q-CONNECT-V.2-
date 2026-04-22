// d:\projects\QCONNECT(V2.0)\frontend\src\components\shared\Button.jsx
/**
 * Reusable button component with theme styling.
 * @param {{children:import("react").ReactNode,type?:"button"|"submit"|"reset",variant?:"primary"|"secondary",onClick?:()=>void,disabled?:boolean,className?:string}} props
 * @returns {JSX.Element}
 */
export default function Button({ children, type = "button", variant = "primary", onClick, disabled = false, className = "" }) {
  const baseClasses = "px-4 py-2 font-semibold rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-card text-textPrimary border border-border hover:bg-sidebar"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
