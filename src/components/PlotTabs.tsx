import {
  AxisConfigRecord,
  AxisConfigUpdateRequest,
  CartesianPlaneConfig,
  TableData,
} from "@/types";
import type { TabsProps } from "antd";
import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Skeleton,
  Tabs,
  Popover,
  message,
} from "antd";
import { AxisSelector } from "./AxisSelector";
import { api } from "../api";
import { CartesianPlot } from "./CartesianPlot";
import useSWR from "swr";
import { useSwrDefaultConfig } from "../hooks/useSWRDefaultConfig";
import { useState, useEffect } from "react";

interface PlotTabProps {
  tableData: TableData;
  toggleDrawer: (setting: AxisConfigRecord) => void;
}

function getAxisKey(axisConfigRecord: AxisConfigRecord): string {
  return `axis-${axisConfigRecord.id}`;
}

function getAxisIdFromKey(key: string): number | undefined {
  const match = key.match(/axis-(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

const NULL_ACTIVE_KEY = "0";

export default function PlotTabs({ tableData, toggleDrawer }: PlotTabProps) {
  const {
    data: axisSettings,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<AxisConfigRecord[] | undefined>(
    "axis-settings",
    async () => {
      return await api.getAxisSettings();
    },
    useSwrDefaultConfig
  );
  const [activeKey, setActiveKey] = useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [deleteTabKey, setDeleteTabKey] = useState<string | null>(null);
  const [addTabForm] = Form.useForm();
  const [editTabNameForm] = Form.useForm();
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [isTabNamePopoverOpen, setIsTabNamePopoverOpen] =
    useState<boolean>(false);
  const [isCreatingNewTab, setIsCreatingNewTab] = useState<boolean>(false);

  const dimensions = tableData.dimensions?.map((d) => d.name);

  // Track which axis settings are being edited and their temporary states
  const [editingAxisId, setEditingAxisId] = useState<number | null>(null);
  const [pendingSettings, setPendingSettings] =
    useState<CartesianPlaneConfig | null>(null);

  // Save changes to the backend
  const saveAxisSettings = async (
    axisId: number,
    config: CartesianPlaneConfig
  ) => {
    const axis = axisSettings?.find((a) => a.id === axisId);
    if (axis && config) {
      console.log("Saving axis settings:", axisId, config);

      try {
        await api.updateAxisSetting(axis.id, {
          name: axis.name,
          xNegativeCriteriaId: config.xNegative.id,
          xPositiveCriteriaId: config.xPositive.id,
          yNegativeCriteriaId: config.yNegative.id,
          yPositiveCriteriaId: config.yPositive.id,
        });

        // Refresh the data and reset editing state
        await mutate();
        setEditingAxisId(null);
        setPendingSettings(null);
      } catch (error) {
        console.error("Failed to save axis settings:", error);
      }
    }
  };

  // Cancel changes and restore original settings
  const cancelAxisSettings = () => {
    setEditingAxisId(null);
    setPendingSettings(null);
  };

  // Handle tab name editing
  const startEditingTabName = (axisId: number) => {
    setEditingTabId(axisId);
    setIsTabNamePopoverOpen(true);
  };

  // Handle tab name update
  const handleTabNameUpdate = async (values: { name: string }) => {
    if (editingTabId === null) return;

    // Find the current axis setting
    const currentSetting = axisSettings?.find(
      (setting) => setting.id === editingTabId
    );
    if (!currentSetting) return;

    // Check if name has changed
    if (currentSetting.name === values.name) {
      console.log("Tab name unchanged, skipping update");
      setEditingTabId(null);
      setIsTabNamePopoverOpen(false);
      return;
    }

    try {
      // We need to include all required fields from the existing settings
      await api.updateAxisSetting(editingTabId, {
        name: values.name,
        xNegativeCriteriaId: currentSetting.settings.xNegative.id,
        xPositiveCriteriaId: currentSetting.settings.xPositive.id,
        yNegativeCriteriaId: currentSetting.settings.yNegative.id,
        yPositiveCriteriaId: currentSetting.settings.yPositive.id,
      });

      // Refresh the data
      await mutate();

      // Reset editing state
      setEditingTabId(null);
      setIsTabNamePopoverOpen(false);
    } catch (error) {
      console.error("Failed to update tab name:", error);
    }
  };

  const cancelTabNameEdit = () => {
    setEditingTabId(null);
    setIsTabNamePopoverOpen(false);
    editTabNameForm.resetFields();
  };

  const handlePlotSettingsChange = (
    axis: AxisConfigRecord,
    config: CartesianPlaneConfig
  ) => {
    console.log("Plot settings changed:", axis.id, config);

    // If this is the first change for this axis, set the editing ID
    if (editingAxisId !== axis.id) {
      setEditingAxisId(axis.id);
    }

    // Store the update in pending settings
    setPendingSettings(config);
  };

  const items: TabsProps["items"] = axisSettings?.map((axisConfigRecord) => {
    // Check if this is the currently editing axis
    const isEditing = editingAxisId === axisConfigRecord.id;

    // Determine which settings to use for the plot
    const displaySettings =
      isEditing && pendingSettings
        ? pendingSettings
        : axisConfigRecord.settings;

    const tabLabel = (
      <div className="flex items-center gap-2">
        <span>{axisConfigRecord.name}</span>
        {activeKey === getAxisKey(axisConfigRecord) && (
          <Popover
            open={isTabNamePopoverOpen && editingTabId === axisConfigRecord.id}
            title="Edit Tab Name"
            trigger="click"
            content={
              <Form
                form={editTabNameForm}
                layout="vertical"
                onKeyDown={(e) => {
                  // Prevent the keydown event from bubbling up to the Tabs component
                  e.stopPropagation();
                }}
                onFinish={handleTabNameUpdate}
                initialValues={{ name: axisConfigRecord.name }}
                autoComplete="off"
              >
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: "Please enter tab name" }]}
                >
                  <Input placeholder="Enter tab name" />
                </Form.Item>
                <div className="flex justify-end gap-2">
                  <Button size="small" onClick={cancelTabNameEdit}>
                    Cancel
                  </Button>
                  <Button size="small" type="primary" htmlType="submit">
                    Save
                  </Button>
                </div>
              </Form>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent tab switch
                startEditingTabName(axisConfigRecord.id);
              }}
              className="ml-2 text-gray-500 hover:text-blue-500 focus:outline-none"
              title="Edit Tab Name"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </Popover>
        )}
      </div>
    );

    return {
      key: getAxisKey(axisConfigRecord),
      label: tabLabel,
      children: (
        <div>
          <AxisSelector
            dimensions={dimensions}
            record={{
              ...axisConfigRecord,
              settings: displaySettings, // Use the same settings for both the selector and plot
            }}
            onSettingsChange={(settings: CartesianPlaneConfig) =>
              handlePlotSettingsChange(axisConfigRecord, settings)
            }
            noForm={true} // Don't use a form in the tab content
            tableData={tableData} // Pass tableData to look up dimension IDs
          />

          {/* Submit/Cancel buttons when editing */}
          {isEditing && (
            <div className="flex justify-end gap-2 mt-4 mb-4">
              <Button onClick={() => cancelAxisSettings()} danger>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  saveAxisSettings(axisConfigRecord.id, pendingSettings!)
                }
              >
                Save Changes
              </Button>
            </div>
          )}

          {tableData.dimensions?.length >= 4 && (
            <div className="mb-24 relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => toggleDrawer(axisConfigRecord)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                  title="Magnify Plot"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                    <path
                      fillRule="evenodd"
                      d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Add a "preview" badge when showing modified settings */}
              {isEditing && (
                <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-white px-3 py-1 rounded-full">
                  Preview
                </div>
              )}

              <CartesianPlot data={tableData} settings={displaySettings} />
            </div>
          )}
        </div>
      ),
    };
  });

  const onEdit = async (
    _targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      setIsDrawerOpen(true);
    } else {
      setDeleteTabKey(_targetKey as string);
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    // Only set activeKey automatically if it's not set or invalid
    // AND we're not in the middle of a delete operation
    if (
      (!activeKey ||
        activeKey === NULL_ACTIVE_KEY ||
        (axisSettings &&
          !axisSettings.some((axis) => getAxisKey(axis) === activeKey))) &&
      axisSettings &&
      axisSettings.length > 0 &&
      !deleteTabKey // Don't override during deletion
    ) {
      setActiveKey(getAxisKey(axisSettings[0]));
    } else if (!axisSettings || axisSettings.length === 0) {
      setActiveKey(NULL_ACTIVE_KEY);
    }
  }, [axisSettings, activeKey, deleteTabKey]);

  // Handle form submission for adding a new axis setting
  const handleAddAxisSetting = async (values: AxisConfigUpdateRequest) => {
    try {
      setIsCreatingNewTab(true);
      await api.addAxisSetting(values);
      addTabForm.resetFields();

      // Mutate and wait for the data to be refreshed
      const updatedSettings = await mutate();
      setIsDrawerOpen(false);

      // Find the newly created setting (should be the last one in the list)
      if (updatedSettings && updatedSettings.length > 0) {
        // Find the setting with the name we just added
        const newSetting = updatedSettings.find(
          (setting) => setting.name === values.name
        );
        if (newSetting) {
          // Set active key to the newly created tab
          setActiveKey(getAxisKey(newSetting));
        }
      }
    } catch (error) {
      message.error(`Failed to add new axis setting: ${JSON.stringify(error)}`);
    } finally {
      setIsCreatingNewTab(false);
    }
  };

  return (
    <Skeleton loading={isLoading || isValidating}>
      <Tabs
        className="m-6"
        activeKey={activeKey}
        onChange={(activeKey) => {
          setActiveKey(activeKey ?? NULL_ACTIVE_KEY);
          setEditingTabId(null);
          setIsTabNamePopoverOpen(false);
          // Get the axis ID from the activeKey
          const axisId = getAxisIdFromKey(activeKey);

          // Find the corresponding axis setting
          const axisSetting = axisSettings?.find(
            (setting) => setting.id === axisId
          );

          // Set the form field value with the tab name if found
          if (axisSetting) {
            editTabNameForm.setFieldsValue({ name: axisSetting.name });
          } else {
            // Reset the form if no matching tab found
            editTabNameForm.resetFields();
          }
        }}
        items={items}
        onEdit={onEdit}
        type="editable-card"
      />

      {/* confirm delete axis setting */}
      <Modal
        open={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        closable
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        onOk={async () => {
          const axisId = getAxisIdFromKey(deleteTabKey ?? "");
          if (axisId) {
            await api.deleteAxisSetting(axisId);
            if (activeKey === deleteTabKey) {
              // focus the last tab if available
              if (axisSettings && axisSettings.length > 1) {
                // Find the index of the deleted tab
                const deletedIndex = axisSettings.findIndex(
                  (axis) => getAxisKey(axis) === deleteTabKey
                );
                // Set active key to the previous tab, or the first tab if deleting the first
                const newActiveIndex = Math.max(0, deletedIndex - 1);
                setActiveKey(getAxisKey(axisSettings[newActiveIndex]));
              }
            }
            await mutate(); // Move mutate after setting the activeKey
            message.success("Axis setting deleted successfully");
          }
          setDeleteTabKey(null); // Reset deleteTabKey after operation is complete
          setIsDialogOpen(false);
        }}
      >
        <p>Are you sure you want to delete this axis setting?</p>
      </Modal>

      {isDrawerOpen && (
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Add New Axis Setting"
          width={520}
        >
          <Form
            form={addTabForm}
            name="addAxisSetting"
            layout="vertical"
            onFinish={handleAddAxisSetting}
            autoComplete="off"
            initialValues={{
              name: "",
              xNegative: dimensions?.[1] || "",
              xPositive: dimensions?.[0] || "",
              yNegative: dimensions?.[3] || "",
              yPositive: dimensions?.[2] || "",
              xPositiveCriteriaId: tableData.dimensions?.[0]?.id,
              xNegativeCriteriaId: tableData.dimensions?.[1]?.id,
              yPositiveCriteriaId: tableData.dimensions?.[2]?.id,
              yNegativeCriteriaId: tableData.dimensions?.[3]?.id,
            }}
          >
            <Form.Item<AxisConfigUpdateRequest>
              label="Tab Name"
              name="name"
              rules={[{ required: true, message: "Please input the tab name" }]}
            >
              <Input placeholder="Enter tab name" />
            </Form.Item>

            <div className="mb-6">
              <h4 className="text-base mb-3">Configure Axis</h4>
              <div className="w-full h-full flex justify-center mb-4">
                {/* Using AxisSelector component for visual selection */}
                {dimensions && dimensions.length >= 4 && (
                  <AxisSelector
                    dimensions={dimensions}
                    record={{
                      id: 0, // Temporary ID
                      name: "",
                      settings: {
                        xPositive: { id: 0, name: dimensions[0] },
                        xNegative: { id: 0, name: dimensions[1] },
                        yPositive: { id: 0, name: dimensions[2] },
                        yNegative: { id: 0, name: dimensions[3] },
                      },
                    }}
                    form={addTabForm}
                    noForm={true} // Use standalone selects instead of Form.Items
                    tableData={tableData} // Pass tableData to look up dimension IDs
                    onSettingsChange={(settings) => {
                      console.log("New axis settings:", settings);

                      // Map the selected names back to their IDs
                      const xPositiveId = tableData.dimensions.find(
                        (d) => d.name === settings.xPositive.name
                      )?.id;
                      const xNegativeId = tableData.dimensions.find(
                        (d) => d.name === settings.xNegative.name
                      )?.id;
                      const yPositiveId = tableData.dimensions.find(
                        (d) => d.name === settings.yPositive.name
                      )?.id;
                      const yNegativeId = tableData.dimensions.find(
                        (d) => d.name === settings.yNegative.name
                      )?.id;

                      // Update the form values with the IDs
                      addTabForm.setFieldsValue({
                        xPositiveCriteriaId: xPositiveId,
                        xNegativeCriteriaId: xNegativeId,
                        yPositiveCriteriaId: yPositiveId,
                        yNegativeCriteriaId: yNegativeId,
                      });
                    }}
                  />
                )}
              </div>
            </div>

            {/* Hidden form items to store criteria IDs */}
            <Form.Item name="xPositiveCriteriaId" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item name="xNegativeCriteriaId" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item name="yPositiveCriteriaId" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item name="yNegativeCriteriaId" hidden={true}>
              <Input />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!dimensions || dimensions.length < 4}
                loading={isCreatingNewTab}
              >
                Create Axis Setting
              </Button>
              {(!dimensions || dimensions.length < 4) && (
                <div className="text-red-500 text-sm mt-2">
                  You need at least 4 dimensions to create an axis setting
                </div>
              )}
            </Form.Item>
          </Form>
        </Drawer>
      )}
    </Skeleton>
  );
}
