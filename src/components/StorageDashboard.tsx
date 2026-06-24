import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface StorageStats {
  db_id: string;
  target: string;
  schema_cache: { count: number; size_bytes: number };
  parquet_files: { count: number; size_bytes: number };
  redis_keys: { count: number; size_bytes: number };
}

import TopNav from './layout/TopNav';

export const StorageDashboard: React.FC = () => {
  const [stats, setStats] = useState<StorageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/storage');
      setStats(response as StorageStats[]);
    } catch (error) {
      console.error("Failed to fetch storage stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-screen bg-neutral-50 flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex-1 bg-surface flex flex-col p-8 overflow-y-auto w-full h-full">
        <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Storage Usage</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your active cache and queue storage.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm text-neutral-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 bg-white border border-neutral-200 rounded-xl">
          <svg className="w-12 h-12 mx-auto text-neutral-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          No active storage found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => {
            const totalBytes = stat.schema_cache.size_bytes + stat.parquet_files.size_bytes + stat.redis_keys.size_bytes;
            
            return (
              <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 truncate" title={stat.db_id}>DB: {stat.db_id.slice(0, 8)}...</h3>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">{stat.target === '__all__' ? 'Global Database' : stat.target}</p>
                  </div>
                  <div className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {formatBytes(totalBytes)}
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      DuckDB Cache
                    </div>
                    <div className="font-medium">
                      {stat.parquet_files.count > 0 ? (
                        <span>{stat.parquet_files.count} files ({formatBytes(stat.parquet_files.size_bytes)})</span>
                      ) : (
                        <span className="text-neutral-400">Empty</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Redis Queue
                    </div>
                    <div className="font-medium">
                      {stat.redis_keys.count > 0 ? (
                        <span>{stat.redis_keys.count} tasks ({formatBytes(stat.redis_keys.size_bytes)})</span>
                      ) : (
                        <span className="text-neutral-400">Empty</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      MongoDB Schema
                    </div>
                    <div className="font-medium">
                      {stat.schema_cache.count > 0 ? (
                        <span>Cached ({formatBytes(stat.schema_cache.size_bytes)})</span>
                      ) : (
                        <span className="text-neutral-400">Not Cached</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
