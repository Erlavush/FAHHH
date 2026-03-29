import { useEffect, useState } from "react";

/**
 * Hook to calculate a dynamic UI scale based on window width.
 * Target design width is 2560px (to shrink UI to 75% on 1080p screens).
 * Returns a scale factor between 0.6 and 1.15.
 */
export function useUiScale(baseWidth = 2200) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const currentWidth = window.innerWidth;
      // Allow scaling both down and up, but clamp to reasonable limits.
      // INCREASE Math.max value (currently 0.60) to make mobile view BIGGER.
      const responsiveScale = Math.min(1.15, Math.max(0.60, currentWidth / baseWidth));
      setScale(responsiveScale);
    };

    window.addEventListener("resize", updateScale);
    updateScale();
    return () => window.removeEventListener("resize", updateScale);
  }, [baseWidth]);

  return scale;
}
