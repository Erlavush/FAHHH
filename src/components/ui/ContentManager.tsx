import { useState } from "react";
import { FURNITURE_REGISTRY, type FurnitureType, type FurnitureDefinition } from "../../lib/furnitureRegistry";

export function ContentManager() {
  const [registryState, setRegistryState] = useState<Record<FurnitureType, FurnitureDefinition>>(
    () => JSON.parse(JSON.stringify(FURNITURE_REGISTRY))
  );
  const [selectedKey, setSelectedKey] = useState<FurnitureType>("chair");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeItem = registryState[selectedKey];

  const handleFieldChange = (field: keyof FurnitureDefinition, value: string | number) => {
    setRegistryState(prev => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey],
        [field]: value
      }
    }));
  };

  const handleSaveToCodebase = async () => {
    if (!import.meta.env.DEV) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/__editor/save-furniture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registryState)
      });
      
      if (!res.ok) {
         throw new Error("Save failed on backend plugin.");
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save to codebase. Is the Vite plugin running?");
    } finally {
      setIsSaving(false);
    }
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="content-manager" style={{ padding: 24, paddingBottom: 64, color: "#fff", background: "#1a1a1a", height: "100%", overflowY: "auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, borderBottom: "1px solid #333", paddingBottom: 16 }}>
        <div>
           <h2 style={{ margin: 0, padding: 0 }}>Content Engine</h2>
           <p style={{ margin: 0, marginTop: 4, color: "#888", fontSize: "0.9em" }}>Visual registry editor powered by the Vite dev server.</p>
        </div>
        <button 
          onClick={() => { void handleSaveToCodebase(); }}
          disabled={isSaving}
          style={{ padding: "8px 24px", background: saveSuccess ? "#16a34a" : "#ca8a04", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
        >
          {isSaving ? "Writing to disk..." : saveSuccess ? "Saved successfully!" : "Save Changes to Disk"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 4, height: "calc(100vh - 200px)", overflowY: "auto" }}>
          {Object.keys(registryState).map(k => (
            <button 
              key={k} 
              onClick={() => setSelectedKey(k as FurnitureType)}
              style={{
                padding: "10px 12px",
                textAlign: "left",
                background: selectedKey === k ? "#262626" : "transparent",
                color: "white",
                border: "1px solid #333",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: selectedKey === k ? "bold" : "normal"
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, background: "#262626", padding: 24, borderRadius: 8 }}>
          <h3 style={{ margin: 0 }}>Editing item mapping: <code style={{ color: "#ca8a04" }}>{selectedKey}</code></h3>
          
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: "bold", fontSize: 14 }}>
            In-Game Shop Label
            <input 
              value={activeItem.label} 
              onChange={e => handleFieldChange("label", e.target.value)} 
              style={{ padding: "10px 12px", background: "#1a1a1a", color: "white", border: "1px solid #444", borderRadius: 4 }}
            />
          </label>
          
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: "bold", fontSize: 14 }}>
            Shop Price (Coins)
            <input 
              type="number"
              value={activeItem.price} 
              onChange={e => handleFieldChange("price", Number(e.target.value))} 
              style={{ padding: "10px 12px", background: "#1a1a1a", color: "white", border: "1px solid #444", borderRadius: 4 }}
            />
          </label>
          
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: "bold", fontSize: 14 }}>
            Description
            <textarea 
              value={activeItem.shortDescription} 
              onChange={e => handleFieldChange("shortDescription", e.target.value)} 
              style={{ padding: "10px 12px", background: "#1a1a1a", color: "white", border: "1px solid #444", borderRadius: 4, minHeight: 80, fontFamily: "inherit" }}
            />
          </label>
          
          <div style={{ display: "flex", gap: 16 }}>
             <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: "bold", fontSize: 14, flex: 1 }}>
                Grid Footprint Width (X)
                <input 
                  type="number"
                  value={activeItem.footprintWidth} 
                  onChange={e => handleFieldChange("footprintWidth", Number(e.target.value))} 
                  style={{ padding: "10px 12px", background: "#1a1a1a", color: "white", border: "1px solid #444", borderRadius: 4 }}
                />
             </label>
             <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: "bold", fontSize: 14, flex: 1 }}>
                Grid Footprint Depth (Z)
                <input 
                  type="number"
                  value={activeItem.footprintDepth} 
                  onChange={e => handleFieldChange("footprintDepth", Number(e.target.value))} 
                  style={{ padding: "10px 12px", background: "#1a1a1a", color: "white", border: "1px solid #444", borderRadius: 4 }}
                />
             </label>
          </div>
        </div>
      </div>
    </div>
  );
}
