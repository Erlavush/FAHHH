import { type ChangeEvent, useCallback, useRef, useState } from "react";

export function useSkinImport(initialSkinSrc: string | null) {
  const [skinSrc, setSkinSrc] = useState<string | null>(initialSkinSrc);
  const [skinError, setSkinError] = useState<string | null>(null);
  const skinInputRef = useRef<HTMLInputElement | null>(null);

  const handleSkinImport = useCallback(() => {
    skinInputRef.current?.click();
  }, []);

  const handleSkinFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "image/png") {
      setSkinError("Use a PNG skin file in the normal Minecraft format.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setSkinError("That skin file could not be read.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
          setSkinError("Use a 64x64 or 64x32 Minecraft skin PNG.");
          return;
        }

        setSkinSrc(result);
        setSkinError(null);
      };
      image.onerror = () => {
        setSkinError("That skin image could not be loaded.");
      };
      image.src = result;
    };

    reader.onerror = () => {
      setSkinError("That skin file could not be read.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }, []);

  return {
    skinSrc,
    setSkinSrc,
    skinError,
    setSkinError,
    skinInputRef,
    handleSkinImport,
    handleSkinFileChange
  };
}