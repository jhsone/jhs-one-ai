'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/format'
import { FileText, Image, HardDrive, Upload, AlertCircle } from 'lucide-react'

interface AttachmentStats {
  total_files: number
  total_storage: number
  type_counts: Record<string, number>
  recent: any[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
}

export default function AdminAttachmentsPage() {
  const [data, setData] = useState<AttachmentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/attachments')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attachments</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data?.total_files?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <HardDrive className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatBytes(data?.total_storage || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Images</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data?.type_counts?.image || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data?.type_counts?.document || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent uploads */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Uploads</h3>
        {(data?.recent || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertCircle className="h-12 w-12 mb-3" />
            <p>No attachments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500">File</th>
                  <th className="text-left py-3 px-3 text-gray-500">Type</th>
                  <th className="text-left py-3 px-3 text-gray-500">Size</th>
                  <th className="text-left py-3 px-3 text-gray-500">User</th>
                  <th className="text-left py-3 px-3 text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent?.map((att: any) => (
                  <tr key={att.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {att.file_type === 'image' ? (
                          <img src={att.thumbnail_url || att.cloudinary_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {att.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="default" className="text-[10px] capitalize">{att.file_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{formatBytes(att.file_size)}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{att.profiles?.display_name || '—'}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{formatDate(att.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
