import React, { useState, useEffect } from 'react';

const DatabaseViewer = () => {
  const [databaseInfo, setDatabaseInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/database-viewer');
      const data = await response.json();
      
      if (data.success) {
        setDatabaseInfo(data.databaseInfo);
        if (data.databaseInfo.length > 0) {
          setSelectedTable(data.databaseInfo[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch database information');
      }
    } catch (err) {
      setError('Failed to connect to the database server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = databaseInfo.filter(table =>
    table.tableName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTableData = (data, columns) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>;
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="table-header">
                  <div className="column-info">
                    <span className="column-name">{column.Field}</span>
                    <span className="column-type">{column.Type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="table-row">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="table-cell">
                    {renderCellValue(row[column.Field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCellValue = (value) => {
    if (value === null) {
      return <span className="null-value">NULL</span>;
    }
    if (typeof value === 'boolean') {
      return <span className={`boolean-value ${value ? 'true' : 'false'}`}>
        {value ? 'true' : 'false'}
      </span>;
    }
    if (typeof value === 'object') {
      return <pre className="json-value">{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span className="text-value">{String(value)}</span>;
  };

  if (loading) {
    return (
      <div className="database-viewer">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading database information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="database-viewer">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchDatabaseInfo} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="database-viewer">
      <div className="header">
        <h1>Database Viewer</h1>
        <div className="controls">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={fetchDatabaseInfo} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="content">
        <div className="sidebar">
          <h3>Tables ({filteredTables.length})</h3>
          <div className="table-list">
            {filteredTables.map((table) => (
              <div
                key={table.tableName}
                className={`table-item ${selectedTable?.tableName === table.tableName ? 'active' : ''}`}
                onClick={() => setSelectedTable(table)}
              >
                <div className="table-name">{table.tableName}</div>
                <div className="table-stats">
                  <span className="row-count">{table.totalRows} rows</span>
                  {table.totalRows > 100 && (
                    <span className="limited">(showing first 100)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {selectedTable ? (
            <div className="table-details">
              <div className="table-header-info">
                <h2>{selectedTable.tableName}</h2>
                <div className="table-meta">
                  <span className="total-rows">
                    Total Rows: {selectedTable.totalRows}
                  </span>
                  <span className="displayed-rows">
                    Displayed: {selectedTable.displayedRows}
                  </span>
                </div>
              </div>

              <div className="table-structure">
                <h3>Table Structure</h3>
                <div className="structure-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Null</th>
                        <th>Key</th>
                        <th>Default</th>
                        <th>Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.columns.map((column, index) => (
                        <tr key={index}>
                          <td>{column.Field}</td>
                          <td>{column.Type}</td>
                          <td>{column.Null}</td>
                          <td>{column.Key}</td>
                          <td>{column.Default || 'NULL'}</td>
                          <td>{column.Extra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="table-data">
                <h3>Table Data</h3>
                {renderTableData(selectedTable.data, selectedTable.columns)}
              </div>
            </div>
          ) : (
            <div className="no-table-selected">
              <p>Select a table from the sidebar to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer; 