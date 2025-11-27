"use client";

interface QueryResultTableProps {
  data: any;
}

export function QueryResultTable({ data }: QueryResultTableProps) {
  if (!data || typeof data !== "object") {
    return <div className="text-sm text-muted-foreground">无数据</div>;
  }

  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      return <div className="text-sm text-destructive">数据格式错误</div>;
    }
  }

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return <div className="text-sm text-muted-foreground">查询结果为空</div>;
  }

  const columns = Object.keys(parsedData[0]);

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 text-left font-medium whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {parsedData.slice(0, 100).map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/50">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-2 whitespace-nowrap">
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {parsedData.length > 100 && (
        <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          显示前 100 条，共 {parsedData.length} 条记录
        </div>
      )}
    </div>
  );
}
