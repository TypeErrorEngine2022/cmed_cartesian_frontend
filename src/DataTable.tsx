import { useState, useRef } from "react";
import { TableData } from "./types";
import { api } from "./api";

interface DataTableProps {
  data: TableData;
  onDataChange: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, onDataChange }) => {
  const [newColumnName, setNewColumnName] = useState("");
  const [newRowName, setNewRowName] = useState("");
  const [editCellInfo, setEditCellInfo] = useState<{
    rowName: string;
    columnName: string;
    value: string;
  } | null>(null);
  const [editAnnotationInfo, setEditAnnotationInfo] = useState<{
    rowName: string;
    value: string;
  } | null>(null);
  const [editRowNameInfo, setEditRowNameInfo] = useState<{
    rowName: string;
    value: string;
  } | null>(null);
  const [deleteColumnConfirm, setDeleteColumnConfirm] = useState<string | null>(
    null
  );
  const [deleteRowConfirm, setDeleteRowConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    if (data.columns.includes(newColumnName)) {
      alert("已存在相同名稱的欄位。請選擇另一個名稱。");
      return;
    }

    try {
      await api.addColumn(newColumnName);
      setNewColumnName("");
      onDataChange();
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };

  const handleAddRow = async () => {
    if (!newRowName.trim()) return;
    if (data.rows.some((row) => row.name === newRowName)) {
      alert("已存在相同名稱的行。請選擇另一個名稱。");
      return;
    }

    try {
      await api.addRow(newRowName);
      setNewRowName("");
      onDataChange();
    } catch (error) {
      console.error("Error adding row:", error);
    }
  };

  const handleCellClick = (
    rowName: string,
    columnName: string,
    value: string
  ) => {
    setEditCellInfo({ rowName, columnName, value });
    setEditAnnotationInfo(null); // Close any open annotation editor
  };

  const handleCellUpdate = async () => {
    if (!editCellInfo) return;

    // Get the current value from the data structure for comparison
    const currentRow = data.rows.find(
      (row) => row.name === editCellInfo.rowName
    );
    const currentValue =
      currentRow?.attributes[editCellInfo.columnName] || "NA";

    // Only update if the value has actually changed
    if (editCellInfo.value && editCellInfo.value !== currentValue) {
      try {
        await api.updateCell(
          editCellInfo.rowName,
          editCellInfo.columnName,
          editCellInfo.value
        );
        onDataChange();
      } catch (error) {
        console.error("Error updating cell:", error);
      }
    }

    // Reset edit cell info regardless of whether we updated
    setEditCellInfo(null);
  };

  const handleAnnotationClick = (rowName: string, value: string) => {
    setEditAnnotationInfo({ rowName, value });
    setEditCellInfo(null); // Close any open cell editor
  };

  const handleAnnotationUpdate = async () => {
    if (!editAnnotationInfo) return;

    const currentRow = data.rows.find(
      (row) => row.name === editAnnotationInfo.rowName
    );
    const currentValue = currentRow?.annotation || "";

    if (editAnnotationInfo.value && editAnnotationInfo.value !== currentValue) {
      try {
        await api.updateAnnotation(
          editAnnotationInfo.rowName,
          editAnnotationInfo.value
        );
        setEditAnnotationInfo(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating annotation:", error);
      }
    } else {
      // If the value hasn't changed, just reset the edit state
      setEditAnnotationInfo(null);
    }
  };

  const handleRowNameClick = (rowName: string, value: string) => {
    setEditRowNameInfo({ rowName, value });
    setEditCellInfo(null); // Close any open cell editor
  };

  const handleRowNameUpdate = async () => {
    if (!editRowNameInfo) return;

    const currentRow = data.rows.find(
      (row) => row.name === editRowNameInfo.rowName
    );
    const currentValue = currentRow?.name || "NA";

    if (editRowNameInfo.value && editRowNameInfo.value !== currentValue) {
      try {
        await api.updateRowName(editRowNameInfo.rowName, editRowNameInfo.value);
        setEditRowNameInfo(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating row name:", error);
      }
    } else {
      // If the value hasn't changed, just reset the edit state
      setEditRowNameInfo(null);
    }
  };

  const handleDeleteColumnClick = (columnName: string) => {
    setDeleteColumnConfirm(columnName);
  };

  const handleDeleteColumnCancel = () => {
    setDeleteColumnConfirm(null);
  };

  const handleDeleteColumnConfirm = async () => {
    if (!deleteColumnConfirm) return;

    try {
      await api.deleteColumn(deleteColumnConfirm);
      setDeleteColumnConfirm(null);
      onDataChange();
    } catch (error) {
      console.error("Error deleting column:", error);
    }
  };

  const handleDeleteRowClick = (rowName: string) => {
    setDeleteRowConfirm(rowName);
  };

  const handleDeleteRowCancel = () => {
    setDeleteRowConfirm(null);
  };

  const handleDeleteRowConfirm = async () => {
    if (!deleteRowConfirm) return;

    try {
      await api.deleteRow(deleteRowConfirm);
      setDeleteRowConfirm(null);
      onDataChange();
    } catch (error) {
      console.error("Error deleting column:", error);
    }
  };

  const handleExportTable = async () => {
    try {
      const exportData = await api.exportTable();

      // Create a file to download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      // Create download link and trigger it
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cartesian-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting table:", error);
      alert("匯出數據失敗。請重試。");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportTable = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setImportError(null);

    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          // Validate data structure
          if (
            !importData.data ||
            !importData.data.columns ||
            !importData.data.rows
          ) {
            setImportError("檔案格式無效。請使用有效的匯出檔案。");
            return;
          }

          // Confirm before importing
          if (
            window.confirm(
              "匯入將會將數據與現有表格合併。相同行/欄名稱的新數據將覆蓋現有數據。是否繼續？"
            )
          ) {
            await api.importTable(importData.data);
            onDataChange();
            alert("數據已成功匯入並合併！");
          }
        } catch (error) {
          console.error("Error parsing import file:", error);
          setImportError("無法解析匯入檔案。請確保它是有效的 JSON 檔案。");
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading import file:", error);
      setImportError("無法讀取匯入檔案。");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold mb-4">Data Table</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportTable}
            className="text-sm px-4 py-2 rounded border-solid border-black border-[1px] hover:bg-gray-200"
          >
            Export Table
          </button>
          <button
            onClick={handleImportClick}
            className="text-sm px-4 py-2 rounded border-solid border-black border-[1px] hover:bg-gray-200"
          >
            Import Table
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportTable}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {deleteColumnConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">確認刪除</h3>
            <p className="mb-4">
              {`您確定要刪除欄位「${deleteColumnConfirm}
              」嗎？此操作無法撤銷，並會刪除此欄位中的所有數據。`}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteColumnCancel}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleDeleteColumnConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRowConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">確認刪除</h3>
            <p className="mb-4">
              {`您確定要刪除行「${deleteRowConfirm}
              」嗎？此操作無法撤銷，並會刪除此行中的所有數據。`}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteRowCancel}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleDeleteRowConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{importError}</p>
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="New column name"
            className="p-2 border rounded w-full"
          />
        </div>
        <button
          onClick={handleAddColumn}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Column
        </button>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={newRowName}
            onChange={(e) => setNewRowName(e.target.value)}
            placeholder="New row name"
            className="p-2 border rounded w-full mb-2"
          />
        </div>
        <button
          onClick={handleAddRow}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 self-start"
        >
          Add Row
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Annotation</th>
            {data.columns.map((column) => (
              <th key={column} className="relative group">
                {column}
                <button
                  onClick={() => handleDeleteColumnClick(column)}
                  className="absolute top-0 right-0 text-xs text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete column"
                >
                  ×
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.name}>
              <td
                onClick={() => handleRowNameClick(row.name, row.name)}
                className="relative group cursor-pointer"
              >
                {editRowNameInfo && editRowNameInfo.rowName === row.name ? (
                  <div className="flex">
                    <input
                      type="text"
                      value={editRowNameInfo.value}
                      onChange={(e) =>
                        setEditRowNameInfo({
                          ...editRowNameInfo,
                          value: e.target.value,
                        })
                      }
                      autoFocus
                      className="p-1 border rounded flex-1"
                      onBlur={handleRowNameUpdate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRowNameUpdate();
                        }
                      }}
                    />
                  </div>
                ) : (
                  row.name || "-"
                )}
                <button
                  onClick={() => handleDeleteRowClick(row.name)}
                  className="absolute cursor-pointer  top-0 right-0 text-xs text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete column"
                >
                  ×
                </button>
              </td>
              <td
                onClick={() => handleAnnotationClick(row.name, row.annotation)}
                className="cursor-pointer"
              >
                {editAnnotationInfo &&
                editAnnotationInfo.rowName === row.name ? (
                  <div className="flex">
                    <input
                      type="text"
                      value={editAnnotationInfo.value}
                      onChange={(e) =>
                        setEditAnnotationInfo({
                          ...editAnnotationInfo,
                          value: e.target.value,
                        })
                      }
                      autoFocus
                      className="p-1 border rounded flex-1"
                      onBlur={handleAnnotationUpdate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAnnotationUpdate();
                        }
                      }}
                    />
                  </div>
                ) : (
                  row.annotation || ""
                )}
              </td>
              {data.columns.map((column) => (
                <td
                  key={`${row.name}-${column}`}
                  onClick={() =>
                    handleCellClick(
                      row.name,
                      column,
                      row.attributes[column] || "NA"
                    )
                  }
                  className="cursor-pointer"
                >
                  {editCellInfo &&
                  editCellInfo.rowName === row.name &&
                  editCellInfo.columnName === column ? (
                    <div className="flex">
                      <input
                        type="text"
                        value={editCellInfo.value}
                        onChange={(e) =>
                          setEditCellInfo({
                            ...editCellInfo,
                            value: e.target.value,
                          })
                        }
                        autoFocus
                        className="p-1 border rounded flex-1"
                        onBlur={handleCellUpdate}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellUpdate();
                          }
                        }}
                      />
                    </div>
                  ) : (
                    row.attributes[column] || "NA"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
