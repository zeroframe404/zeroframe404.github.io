export type AdminTaskStatus = 'pending' | 'completed'

export interface AdminTaskUserSummary {
  id: string
  username: string
  role_name: string | null
}

export interface AdminTaskAttachmentRow {
  id: string
  created_at: string
  original_name: string
  mime_type: string
  size_bytes: number
  is_previewable: boolean
  uploader_user: AdminTaskUserSummary | null
}

export interface AdminTaskMessageAttachmentRow {
  id: string
  created_at: string
  original_name: string
  mime_type: string
  size_bytes: number
  is_previewable: boolean
  uploader_user: AdminTaskUserSummary | null
}

export interface AdminTaskMessageRow {
  id: string
  created_at: string
  body_markdown: string
  sender_user: AdminTaskUserSummary | null
  attachments: AdminTaskMessageAttachmentRow[]
}

export interface AdminTaskRow {
  id: string
  created_at: string
  updated_at: string
  description_markdown: string
  status: AdminTaskStatus
  completed_at: string | null
  created_by_user: AdminTaskUserSummary | null
  completed_by_user: AdminTaskUserSummary | null
  assignees: AdminTaskUserSummary[]
  attachments: AdminTaskAttachmentRow[]
  message_count: number
  last_message_at: string | null
}

export interface AdminTaskDetailResponse {
  task: AdminTaskRow
  messages: AdminTaskMessageRow[]
}

export interface AdminTaskListResponse {
  tasks: AdminTaskRow[]
}

export interface AdminTaskAssigneeRow {
  id: string
  username: string
  role_name: string | null
}

export interface AdminTaskAssigneeListResponse {
  assignees: AdminTaskAssigneeRow[]
}
