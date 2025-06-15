import { useState, useEffect } from "react";
import { AxisConfigRecord, CartesianPlaneConfig, TableData } from "../types";
import { Form, Select } from "antd";

interface AxisSelectorProps {
  record: AxisConfigRecord;
  dimensions: string[];
  onSettingsChange: (settings: CartesianPlaneConfig) => void;
  form?: any; // Optional form instance that can be passed from parent
  formItemClassName?: string; // Optional class for styling form items
  noForm?: boolean; // When true, don't render own Form wrapper
  tableData?: TableData; // Optional tableData to look up dimension IDs
}

export const AxisSelector: React.FC<AxisSelectorProps> = ({
  record,
  dimensions,
  onSettingsChange,
  form: externalForm,
  formItemClassName = "",
  noForm = false,
  tableData,
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
    // Only update form values if we're using a form
    if (!noForm || externalForm) {
      form.setFieldsValue({
        yPositive: record.settings.yPositive.name,
        xPositive: record.settings.xPositive.name,
        yNegative: record.settings.yNegative.name,
        xNegative: record.settings.xNegative.name,
      });
    }
  }, [record.settings, form, noForm, externalForm]);

  const handleSettingChange = (
    axisType: keyof CartesianPlaneConfig,
    newName: string
  ) => {
    // Find the dimension with matching name from the available dimensions
    let dimensionId = 0;

    // If tableData is provided, use it to find the dimension ID
    if (tableData && tableData.dimensions) {
      const matchingDimension = tableData.dimensions.find(
        (d) => d.name === newName
      );
      if (matchingDimension) {
        dimensionId = matchingDimension.id;
      } else {
        console.warn(
          `Dimension with name ${newName} not found in tableData. Using fallback.`
        );
      }
    }

    // Create a new settings object with the updated axis - including ID
    const updatedSettings = {
      ...localSettings,
      [axisType]: {
        id: dimensionId,
        name: newName,
      },
    };

    // Update local state
    setLocalSettings(updatedSettings);

    // Notify parent component about the change
    onSettingsChange(updatedSettings);
  };

  // Direct handler for select changes - always propagate to parent immediately
  const handleSelectChange = (
    axis: keyof CartesianPlaneConfig,
    value: string
  ) => {
    // Update form field if we're using a form
    if (!noForm && form) {
      form.setFieldValue(axis, value);
    }

    // Call setting change handler directly
    handleSettingChange(axis, value);
  };

  // Create select options once
  const selectOptions = dimensions?.map((column) => ({
    label: column,
    value: column,
  }));

  // The axis selector UI component
  const axisSelector = (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* Vertical line */}
      <div className="absolute w-0.5 h-full bg-gray-300"></div>

      {/* Horizontal line */}
      <div className="absolute h-0.5 w-full bg-gray-300"></div>

      {/* Y+ (Up) Axis */}
      <div className="absolute top-0 transform -translate-y-1/2">
        {noForm || externalForm ? (
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={selectOptions}
            value={localSettings.yPositive.name}
            onChange={(value) => handleSelectChange("yPositive", value)}
          />
        ) : (
          <Form.Item name="yPositive" className={formItemClassName} noStyle>
            <Select
              className="w-32 border rounded bg-white shadow-md"
              popupMatchSelectWidth={false}
              options={selectOptions}
              onChange={(value) => handleSelectChange("yPositive", value)}
            />
          </Form.Item>
        )}
      </div>

      {/* X+ (Right) Axis */}
      <div className="absolute right-0 transform translate-x-1/2">
        {noForm || externalForm ? (
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={selectOptions}
            value={localSettings.xPositive.name}
            onChange={(value) => handleSelectChange("xPositive", value)}
          />
        ) : (
          <Form.Item name="xPositive" className={formItemClassName} noStyle>
            <Select
              className="w-32 border rounded bg-white shadow-md"
              popupMatchSelectWidth={false}
              options={selectOptions}
              onChange={(value) => handleSelectChange("xPositive", value)}
            />
          </Form.Item>
        )}
      </div>

      {/* Y- (Down) Axis */}
      <div className="absolute bottom-0 transform translate-y-1/2">
        {noForm || externalForm ? (
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={selectOptions}
            value={localSettings.yNegative.name}
            onChange={(value) => handleSelectChange("yNegative", value)}
          />
        ) : (
          <Form.Item name="yNegative" className={formItemClassName} noStyle>
            <Select
              className="w-32 border rounded bg-white shadow-md"
              popupMatchSelectWidth={false}
              options={selectOptions}
              onChange={(value) => handleSelectChange("yNegative", value)}
            />
          </Form.Item>
        )}
      </div>

      {/* X- (Left) Axis */}
      <div className="absolute left-0 transform -translate-x-1/2">
        {noForm || externalForm ? (
          <Select
            className="w-32 border rounded bg-white shadow-md"
            popupMatchSelectWidth={false}
            options={selectOptions}
            value={localSettings.xNegative.name}
            onChange={(value) => handleSelectChange("xNegative", value)}
          />
        ) : (
          <Form.Item name="xNegative" className={formItemClassName} noStyle>
            <Select
              className="w-32 border rounded bg-white shadow-md"
              popupMatchSelectWidth={false}
              options={selectOptions}
              onChange={(value) => handleSelectChange("xNegative", value)}
            />
          </Form.Item>
        )}
      </div>

      {/* Center point */}
      <div className="absolute w-3 h-3 bg-gray-800 rounded-full"></div>
    </div>
  );

  // Return the component
  return (
    <div className="m-6">
      {!noForm && !externalForm ? (
        <Form
          form={form}
          initialValues={{
            yPositive: localSettings?.yPositive.name,
            xPositive: localSettings?.xPositive.name,
            yNegative: localSettings?.yNegative.name,
            xNegative: localSettings?.xNegative.name,
          }}
          onValuesChange={(_, allValues) => {
            // Update settings when form values change
            if (allValues.yPositive)
              handleSettingChange("yPositive", allValues.yPositive);
            if (allValues.xPositive)
              handleSettingChange("xPositive", allValues.xPositive);
            if (allValues.yNegative)
              handleSettingChange("yNegative", allValues.yNegative);
            if (allValues.xNegative)
              handleSettingChange("xNegative", allValues.xNegative);
          }}
          layout="vertical"
        >
          {axisSelector}
        </Form>
      ) : (
        axisSelector
      )}
    </div>
  );
};
