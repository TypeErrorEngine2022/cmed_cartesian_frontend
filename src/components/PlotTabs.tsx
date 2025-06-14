import { AxisConfigRecord, CartesianPlaneConfig, TableData } from "@/types";
import type { TabsProps } from "antd";
import { Skeleton, Tabs } from "antd";
import { AxisSelector } from "./AxisSelector";
import { api } from "../api";
import { CartesianPlot } from "./CartesianPlot";
import useSWR from "swr";
import { useSwrDefaultConfig } from "../hooks/useSWRDefaultConfig";
import { useState, useRef, useCallback } from "react";

interface PlotTabProps {
  tableData: TableData;
  toggleDrawer: (setting: AxisConfigRecord) => void;
}

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
      }, 1000); // 1 second debounce
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
    key: `axis-${axisConfigRecord.id}`,
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

  return (
    <Skeleton loading={isLoading || isValidating}>
      <Tabs
        className="m-6"
        defaultActiveKey={axisSettings?.[0]?.id.toString() || "0"}
        items={items}
      />
    </Skeleton>
  );
}
