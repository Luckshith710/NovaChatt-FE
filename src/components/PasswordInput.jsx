import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  disabled = false,
  name,
  id,
  autoComplete,
  ariaLabel = "Password",
  className = "",
  style = {},
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div
      className={`password-input-wrapper ${className}`}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        ...style,
      }}
    >
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        id={id}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        style={{
          width: "100%",
          paddingRight: "44px", // Reserve space for the eye toggle icon
        }}
        {...rest}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: "6px",
          margin: 0,
          width: "auto",
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#737373",
          cursor: disabled ? "not-allowed" : "pointer",
          borderRadius: "6px",
          transition: "color 0.2s ease, transform 0.15s ease",
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.color = "#737373";
        }}
      >
        {showPassword ? (
          <FiEyeOff style={{ fontSize: "18px" }} />
        ) : (
          <FiEye style={{ fontSize: "18px" }} />
        )}
      </button>
    </div>
  );
}

export default PasswordInput;
