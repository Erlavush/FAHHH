import { useCallback, useEffect, useState } from "react";

export function useFurnitureInfoPopover() {
  const [openFurnitureInfoKey, setOpenFurnitureInfoKey] = useState<string | null>(null);
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handleChange = () => {
      setHoverPreviewEnabled(mediaQuery.matches);
    };

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest(".spawn-card__info-wrap")) {
        setOpenFurnitureInfoKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleOpenFurnitureInfo = useCallback((infoKey: string) => {
    setOpenFurnitureInfoKey(infoKey);
  }, []);

  const handleCloseFurnitureInfo = useCallback(() => {
    setOpenFurnitureInfoKey(null);
  }, []);

  const handleToggleFurnitureInfo = useCallback((infoKey: string) => {
    setOpenFurnitureInfoKey((currentKey) => (currentKey === infoKey ? null : infoKey));
  }, []);

  return {
    hoverPreviewEnabled,
    openFurnitureInfoKey,
    handleOpenFurnitureInfo,
    handleCloseFurnitureInfo,
    handleToggleFurnitureInfo
  };
}