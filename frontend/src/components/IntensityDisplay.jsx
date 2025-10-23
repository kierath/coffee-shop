import React from "react";
import "./IntensityDisplay.css";

const IntensityDisplay = ({ level = 4, max = 5, category = "dark" }) => {
  return (
    <div className={`intensity-container ${category}`}>
      <div className="dots">
        {[...Array(max)].map((_, i) => (
          <span
            key={i}
            className={`dot ${i < level ? "filled" : ""}`}
          ></span>
        ))}
      </div>
      <span className="intensity-label">INTENSITY</span>
    </div>
  );
};

export default IntensityDisplay;
