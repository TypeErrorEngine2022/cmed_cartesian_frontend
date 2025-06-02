import { useState, useEffect } from "react";
import { CartesianSettings } from "./types";

interface AxisSelectorProps {
  columns: string[];
  onSettingsChange: (settings: CartesianSettings) => void;
}

export const AxisSelector: React.FC<AxisSelectorProps> = ({
  columns,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<CartesianSettings>({
    xPositive: columns[0] || "",
    xNegative: columns[1] || "",
    yPositive: columns[2] || "",
    yNegative: columns[3] || "",
  });

  useEffect(() => {
    // Only set initial defaults when component first mounts or when columns are empty initially
    if (
      columns.length >= 4 &&
      (settings.xPositive === "" ||
        settings.xNegative === "" ||
        settings.yPositive === "" ||
        settings.yNegative === "" ||
        !columns.includes(settings.xPositive) ||
        !columns.includes(settings.xNegative) ||
        !columns.includes(settings.yPositive) ||
        !columns.includes(settings.yNegative))
    ) {
      setSettings({
        xPositive: columns[0],
        xNegative: columns[1],
        yPositive: columns[2],
        yNegative: columns[3],
      });
    }
  }, [columns, settings]);

  useEffect(() => {
    onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  const handleSettingChange = (
    axis: keyof CartesianSettings,
    value: string
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [axis]: value };
      return newSettings;
    });
  };

  if (columns.length < 4) {
    return (
      <div className="mb-6 p-4 pr-8 bg-yellow-50 text-yellow-800 rounded">
        Please add at least 4 columns to use the Cartesian plot.
      </div>
    );
  }

  return (
    <div className="m-6">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Vertical line */}
        <div className="absolute w-0.5 h-full bg-gray-300"></div>

        {/* Horizontal line */}
        <div className="absolute h-0.5 w-full bg-gray-300"></div>

        {/* Y+ (Up) Axis */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={settings.yPositive}
            onChange={(e) => handleSettingChange("yPositive", e.target.value)}
          >
            {columns.map((column) => (
              <option key={`yPos-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* X+ (Right) Axis */}
        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={settings.xPositive}
            onChange={(e) => handleSettingChange("xPositive", e.target.value)}
          >
            {columns.map((column) => (
              <option key={`xPos-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* Y- (Down) Axis */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={settings.yNegative}
            onChange={(e) => handleSettingChange("yNegative", e.target.value)}
          >
            {columns.map((column) => (
              <option key={`yNeg-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* X- (Left) Axis */}
        <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={settings.xNegative}
            onChange={(e) => handleSettingChange("xNegative", e.target.value)}
          >
            {columns.map((column) => (
              <option key={`xNeg-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* Center point */}
        <div className="absolute w-3 h-3 bg-gray-800 rounded-full"></div>
      </div>
    </div>
  );
};
