import { api } from "../api";
import { TableData } from "../types";
import useSWR from "swr";
import { useSwrDefaultConfig } from "./useSWRDefaultConfig";

export default function useTableData() {
  const {
    data,
    isLoading: isTableDataLoading,
    isValidating: isTableDataRefreshing,
    mutate: refreshTableData,
    error: tableDataError,
  } = useSWR<TableData>(
    "table-data",
    async () => {
      return await api.getTableData();
    },
    useSwrDefaultConfig
  );

  return {
    tableData: data ?? {
      dimensions: [],
      dataPoints: [],
    },
    isTableDataLoading,
    isTableDataRefreshing,
    refreshTableData,
    tableDataError,
  };
}
