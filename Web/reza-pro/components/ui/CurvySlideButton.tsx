"use client";

import React from "react";
import "./CurvySlideButton.css";

export default function CurvySlideButton({
  onClick,
  text = "Hover Me!",
  color = "#FFFB00",
  textColor = "black",
  borderColor = "black",
  hoverTextColor = "white",
  hoverColor = "black",
  styles,
  type = "button",
  disabled = false,
}: {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string | React.ReactNode;
  color?: string;
  textColor?: string;
  borderColor?: string;
  hoverTextColor?: string;
  hoverColor?: string;
  styles?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className="btn-animated">
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        style={{
          ...styles,
          color: textColor,
          background: color,
          border: `2px solid ${borderColor}`,
          position: "relative",
          overflow: "hidden",
          // @ts-expect-error - CSS custom properties
          '--hover-color': hoverColor,
          '--hover-text-color': hoverTextColor,
          '--text-color': textColor,
        }}
      >
        <span>{text}</span>
        <div className="blob"></div>
      </button>
    </div>
  );
}