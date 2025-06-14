import {
  AxisConfigRecord,
  AxisConfigUpdateRequest,
  CartesianPlaneConfig,
  TableData,
} from "@/types";
import type { TabsProps } from "antd";
import { Button, Drawer, Form, Input, Modal, Skeleton, Tabs } from "antd";
import { AxisSelector } from "./AxisSelector";
import { api } from "../api";
import { CartesianPlot } from "./CartesianPlot";
import useSWR from "swr";
import { useSwrDefaultConfig } from "../hooks/useSWRDefaultConfig";
import { useState, useRef, useCallback, useEffect } from "react";

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
  const [addTabForm] = Form.useForm();

  const dimensions = tableData.dimensions?.map((d) => d.name);

  // Use debounce to avoid too many API calls
  const [pendingUpdates, setPendingUpdates] = useState<
    Map<number, CartesianPlaneConfig>
  >(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update pending updates
  const updatePendingSettings = useCallback(
    (axisId: number, config: CartesianPlaneConfig) => {
      setPendingUpdates((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(axisId, config);
        return newMap;
      });

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer to apply updates after delay
      debounceTimerRef.current = setTimeout(async () => {
        if (pendingUpdates.size > 0) {
          // Apply all pending updates
          const updatePromises = Array.from(pendingUpdates).map(
            ([axisId, config]) => {
              const axis = axisSettings?.find((a) => a.id === axisId);
              if (axis) {
                return api.updateAxisSetting(axis.id, {
                  name: axis.name,
                  xNegativeCriteriaId: config.xNegative.id,
                  xPositiveCriteriaId: config.xPositive.id,
                  yNegativeCriteriaId: config.yNegative.id,
                  yPositiveCriteriaId: config.yPositive.id,
                });
              }
              return Promise.resolve();
            }
          );

          await Promise.all(updatePromises);
          setPendingUpdates(new Map());
          mutate(); // Only mutate once after all updates are done
        }
      }, 2000); // 1 second debounce
    },
    [axisSettings, mutate, pendingUpdates]
  );

  const handlePlotSettingsChange = (
    axis: AxisConfigRecord,
    config: CartesianPlaneConfig
  ) => {
    // Store the update in pending updates
    updatePendingSettings(axis.id, config);
  };

  const items: TabsProps["items"] = axisSettings?.map((axisConfigRecord) => ({
    key: getAxisKey(axisConfigRecord),
    label: axisConfigRecord.name,
    children: (
      <div>
        <AxisSelector
          dimensions={dimensions}
          record={axisConfigRecord}
          onSettingsChange={(settings: CartesianPlaneConfig) =>
            handlePlotSettingsChange(axisConfigRecord, settings)
          }
        />

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
            <CartesianPlot
              data={tableData}
              settings={axisConfigRecord.settings}
            />
          </div>
        )}
      </div>
    ),
  }));

  const onEdit = async (
    _targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      setIsDrawerOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    if (
      (!activeKey || activeKey === NULL_ACTIVE_KEY) &&
      axisSettings &&
      axisSettings.length > 0
    ) {
      console.log("Setting active key to first axis setting");
      setActiveKey(getAxisKey(axisSettings[0]));
    } else {
      setActiveKey(NULL_ACTIVE_KEY);
    }
  }, [axisSettings]);

  // Handle form submission for adding a new axis setting
  const handleAddAxisSetting = async (values: AxisConfigUpdateRequest) => {
    await api.addAxisSetting(values);
    addTabForm.resetFields();
    mutate();
    setIsDrawerOpen(false);
  };

  return (
    <Skeleton loading={isLoading || isValidating}>
      <Tabs
        className="m-6"
        activeKey={activeKey}
        onChange={setActiveKey}
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
          const axisId = getAxisIdFromKey(activeKey ?? "");
          if (axisId) {
            await api.deleteAxisSetting(axisId);
            mutate();
            setActiveKey(NULL_ACTIVE_KEY);
          }
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
                    noForm={true} // Don't render a nested form
                    onSettingsChange={(settings) => {
                      console.log("Selected settings:", settings);

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
