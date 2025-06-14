import { useState, useEffect } from "react";
import { AxisConfigRecord, CartesianPlaneConfig } from "../types";

interface AxisSelectorProps {
  record: AxisConfigRecord;
  dimensions: string[];
  onSettingsChange: (settings: CartesianPlaneConfig) => void;
}

export const AxisSelector: React.FC<AxisSelectorProps> = ({
  record,
  dimensions,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<CartesianPlaneConfig>(
    record.settings
  );

  // Update local state when record changes from parent
  useEffect(() => {
    setLocalSettings(record.settings);
  }, [record.settings]);

  const handleSettingChange = (
    axisType: keyof CartesianPlaneConfig,
    newName: string
  ) => {
    // Find the dimension with matching name
    const dimensionObj = record.settings[axisType];

    // Create a new settings object with the updated axis
    const updatedSettings = {
      ...localSettings,
      [axisType]: {
        ...dimensionObj,
        name: newName,
      },
    };

    // Update local state
    setLocalSettings(updatedSettings);

    // Notify parent component about the change
    onSettingsChange(updatedSettings);
  };

  return (
    <div className="m-6">
      <div className="relative w-[50%] lg:w-[20%] aspect-square flex items-center justify-center">
        {/* Vertical line */}
        <div className="absolute w-0.5 h-full bg-gray-300"></div>

        {/* Horizontal line */}
        <div className="absolute h-0.5 w-full bg-gray-300"></div>

        {/* Y+ (Up) Axis */}
        <div className="absolute top-0">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={localSettings?.yPositive.name}
            onChange={(e) => handleSettingChange("yPositive", e.target.value)}
          >
            {dimensions?.map((column) => (
              <option key={`yPos-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* X+ (Right) Axis */}
        <div className="absolute right-0">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={localSettings?.xPositive.name}
            onChange={(e) => handleSettingChange("xPositive", e.target.value)}
          >
            {dimensions?.map((column) => (
              <option key={`xPos-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* Y- (Down) Axis */}
        <div className="absolute bottom-0">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={localSettings?.yNegative.name}
            onChange={(e) => handleSettingChange("yNegative", e.target.value)}
          >
            {dimensions?.map((column) => (
              <option key={`yNeg-${column}`} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* X- (Left) Axis */}
        <div className="absolute left-0">
          <select
            className="p-4 pr-8 border rounded bg-white shadow-md"
            value={localSettings?.xNegative.name}
            onChange={(e) => handleSettingChange("xNegative", e.target.value)}
          >
            {dimensions?.map((column) => (
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
