import { useState, useEffect } from "react";
import { AxisConfigRecord, CartesianPlaneConfig } from "../types";
import { Form, Select } from "antd";

interface AxisSelectorProps {
  record: AxisConfigRecord;
  dimensions: string[];
  onSettingsChange: (settings: CartesianPlaneConfig) => void;
  form?: any; // Optional form instance that can be passed from parent
  formItemClassName?: string; // Optional class for styling form items
  noForm?: boolean; // When true, don't render own Form wrapper
}

export const AxisSelector: React.FC<AxisSelectorProps> = ({
  record,
  dimensions,
  onSettingsChange,
  form: externalForm,
  formItemClassName = "",
  noForm = false,
}) => {
  // Create a local form instance if we're not using an external one
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;

  const [localSettings, setLocalSettings] = useState<CartesianPlaneConfig>(
    record.settings
  );

  // Update local state when record changes from parent
  useEffect(() => {
    setLocalSettings(record.settings);
    form.setFieldsValue({
      yPositive: record.settings.yPositive.name,
      xPositive: record.settings.xPositive.name,
      yNegative: record.settings.yNegative.name,
      xNegative: record.settings.xNegative.name,
    });
  }, [record.settings, form]);

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

  const handleFormValuesChange = (_: any, allValues: any) => {
    // Update settings when form values change
    if (allValues.yPositive)
      handleSettingChange("yPositive", allValues.yPositive);
    if (allValues.xPositive)
      handleSettingChange("xPositive", allValues.xPositive);
    if (allValues.yNegative)
      handleSettingChange("yNegative", allValues.yNegative);
    if (allValues.xNegative)
      handleSettingChange("xNegative", allValues.xNegative);
  };

  // Handle direct select changes when not wrapped in a Form
  const handleSelectChange = (
    axis: keyof CartesianPlaneConfig,
    value: string
  ) => {
    // Update the form field
    form.setFieldValue(axis, value);
    // Call the setting change handler directly
    handleSettingChange(axis, value);
  };

  // The actual axis selector UI component
  const axisSelector = (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* Vertical line */}
      <div className="absolute w-0.5 h-full bg-gray-300"></div>

      {/* Horizontal line */}
      <div className="absolute h-0.5 w-full bg-gray-300"></div>

      {/* Y+ (Up) Axis */}
      <div className="absolute top-0 transform -translate-y-1/2">
        <Form.Item name="yPositive" className={formItemClassName} noStyle>
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={dimensions?.map((column) => ({
              label: column,
              value: column,
            }))}
            onChange={
              noForm
                ? (value) => handleSelectChange("yPositive", value)
                : undefined
            }
          />
        </Form.Item>
      </div>

      {/* X+ (Right) Axis */}
      <div className="absolute right-0 transform translate-x-1/2">
        <Form.Item name="xPositive" className={formItemClassName} noStyle>
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={dimensions?.map((column) => ({
              label: column,
              value: column,
            }))}
            onChange={
              noForm
                ? (value) => handleSelectChange("xPositive", value)
                : undefined
            }
          />
        </Form.Item>
      </div>

      {/* Y- (Down) Axis */}
      <div className="absolute bottom-0 transform translate-y-1/2">
        <Form.Item name="yNegative" className={formItemClassName} noStyle>
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={dimensions?.map((column) => ({
              label: column,
              value: column,
            }))}
            onChange={
              noForm
                ? (value) => handleSelectChange("yNegative", value)
                : undefined
            }
          />
        </Form.Item>
      </div>

      {/* X- (Left) Axis */}
      <div className="absolute left-0 transform -translate-x-1/2">
        <Form.Item name="xNegative" className={formItemClassName} noStyle>
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={dimensions?.map((column) => ({
              label: column,
              value: column,
            }))}
            onChange={
              noForm
                ? (value) => handleSelectChange("xNegative", value)
                : undefined
            }
          />
        </Form.Item>
      </div>

      {/* Center point */}
      <div className="absolute w-3 h-3 bg-gray-800 rounded-full"></div>
    </div>
  );

  // When noForm is true, just return the axis selector without wrapping it in a form
  if (noForm) {
    return <div className="m-6">{axisSelector}</div>;
  }

  // Otherwise, wrap it in a form
  return (
    <div className="m-6">
      <Form
        form={form}
        initialValues={{
          yPositive: localSettings?.yPositive.name,
          xPositive: localSettings?.xPositive.name,
          yNegative: localSettings?.yNegative.name,
          xNegative: localSettings?.xNegative.name,
        }}
        onValuesChange={handleFormValuesChange}
        layout="vertical"
      >
        {axisSelector}
      </Form>
    </div>
  );
};
