import { CheckCircle2, Download, Eye, Loader2, Paperclip, RotateCcw, Send, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, MutableRefObject } from 'react'
import {
  createAdminTask,
  createAdminTaskMessage,
  deleteAdminTask,
  fetchAdminTaskAssignees,
  fetchAdminTaskAttachmentBlob,
  fetchAdminTaskDetail,
  fetchAdminTaskMessageAttachmentBlob,
  fetchAdminTasks,
  updateAdminTaskStatus
} from '../../lib/adminApi'
import type {
  AdminSessionUser,
  AdminTaskAssigneeRow,
  AdminTaskAttachmentRow,
  AdminTaskMessageAttachmentRow,
  AdminTaskMessageRow,
  AdminTaskRow,
  AdminTaskStatus
} from '../../types/admin'

type TaskTab = 'all' | AdminTaskStatus

type AttachmentLike = AdminTaskAttachmentRow | AdminTaskMessageAttachmentRow

interface AdminTasksModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: AdminSessionUser
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short'
})

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed)
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-900 underline">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\+\+(.+?)\+\+/g, '<u>$1</u>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-200 px-1 py-0.5 text-xs">$1</code>')
    .replace(/\n/g, '<br />')
}

function insertMarkdown(input: {
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  value: string
  setValue: (next: string) => void
  prefix: string
  suffix?: string
  placeholder?: string
}) {
  const textarea = input.textareaRef.current
  const suffix = input.suffix ?? ''
  const placeholder = input.placeholder ?? 'texto'

  if (!textarea) {
    input.setValue(`${input.value}${input.prefix}${placeholder}${suffix}`)
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = input.value.slice(start, end) || placeholder
  const replacement = `${input.prefix}${selected}${suffix}`

  input.setValue(input.value.slice(0, start) + replacement + input.value.slice(end))

  window.requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + input.prefix.length, start + input.prefix.length + selected.length)
  })
}

function MarkdownToolbar(props: {
  onFormat: (prefix: string, suffix?: string, placeholder?: string) => void
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('**', '**', 'negrita')}>Negrita</button>
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('*', '*', 'cursiva')}>Cursiva</button>
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('++', '++', 'subrayado')}>Subrayado</button>
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('- ', '', 'item')}>Lista</button>
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('[', '](https://)', 'enlace')}>Enlace</button>
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => props.onFormat('`', '`', 'codigo')}>Codigo</button>
    </div>
  )
}

export default function AdminTasksModal(props: AdminTasksModalProps) {
  const isSuperAdmin = props.currentUser.is_super_admin

  const [activeTab, setActiveTab] = useState<TaskTab>(isSuperAdmin ? 'all' : 'pending')
  const [tasks, setTasks] = useState<AdminTaskRow[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskDetail, setTaskDetail] = useState<AdminTaskRow | null>(null)
  const [taskMessages, setTaskMessages] = useState<AdminTaskMessageRow[]>([])

  const [taskError, setTaskError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [assignees, setAssignees] = useState<AdminTaskAssigneeRow[]>([])
  const [loadingAssignees, setLoadingAssignees] = useState(false)

  const [taskMarkdown, setTaskMarkdown] = useState('')
  const [taskAssigneeIds, setTaskAssigneeIds] = useState<string[]>([])
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [chatMarkdown, setChatMarkdown] = useState('')
  const [chatFiles, setChatFiles] = useState<File[]>([])

  const [savingTask, setSavingTask] = useState(false)
  const [sendingChat, setSendingChat] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false)
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)

  const taskEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const chatEditorRef = useRef<HTMLTextAreaElement | null>(null)

  const availableTabs = useMemo<TaskTab[]>(() => (isSuperAdmin ? ['all', 'pending', 'completed'] : ['pending', 'completed']), [isSuperAdmin])

  const loadTasks = useCallback(async (tab?: TaskTab) => {
    const status = tab ?? activeTab
    setLoadingTasks(true)
    setTaskError(null)

    try {
      const loadedTasks = await fetchAdminTasks({ status, limit: 500 })
      setTasks(loadedTasks)
      setSelectedTaskId((previousTaskId) => {
        if (!previousTaskId) return loadedTasks[0]?.id ?? null
        return loadedTasks.some((task) => task.id === previousTaskId) ? previousTaskId : loadedTasks[0]?.id ?? null
      })
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'No se pudieron cargar tareas.')
    } finally {
      setLoadingTasks(false)
    }
  }, [activeTab])

  const loadTaskDetail = useCallback(async (taskId: string) => {
    setLoadingDetail(true)
    setDetailError(null)

    try {
      const payload = await fetchAdminTaskDetail({ taskId, messageLimit: 600 })
      setTaskDetail(payload.task)
      setTaskMessages(payload.messages)
    } catch (error) {
      setTaskDetail(null)
      setTaskMessages([])
      setDetailError(error instanceof Error ? error.message : 'No se pudo cargar detalle de tarea.')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const loadAssignees = useCallback(async () => {
    if (!isSuperAdmin) return

    setLoadingAssignees(true)
    try {
      const rows = await fetchAdminTaskAssignees()
      setAssignees(rows)
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'No se pudo cargar empleados.')
    } finally {
      setLoadingAssignees(false)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    if (!props.isOpen) return

    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
      return
    }

    void loadTasks(activeTab)
    if (isSuperAdmin) {
      void loadAssignees()
    }
  }, [activeTab, availableTabs, isSuperAdmin, loadAssignees, loadTasks, props.isOpen])

  useEffect(() => {
    if (!props.isOpen || !selectedTaskId) {
      setTaskDetail(null)
      setTaskMessages([])
      return
    }

    void loadTaskDetail(selectedTaskId)
  }, [loadTaskDetail, props.isOpen, selectedTaskId])

  if (!props.isOpen) {
    return null
  }

  const taskFormat = (prefix: string, suffix?: string, placeholder?: string) => {
    insertMarkdown({ textareaRef: taskEditorRef, value: taskMarkdown, setValue: setTaskMarkdown, prefix, suffix, placeholder })
  }

  const chatFormat = (prefix: string, suffix?: string, placeholder?: string) => {
    insertMarkdown({ textareaRef: chatEditorRef, value: chatMarkdown, setValue: setChatMarkdown, prefix, suffix, placeholder })
  }

  const previewAttachment = async (loader: () => Promise<Blob>) => {
    try {
      const blob = await loader()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 60_000)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo abrir la vista previa.')
    }
  }

  const downloadAttachment = async (input: {
    key: string
    fileName: string
    loader: () => Promise<Blob>
  }) => {
    setDownloadingKey(input.key)

    try {
      const blob = await input.loader()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = input.fileName || 'archivo'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo descargar el archivo.')
    } finally {
      setDownloadingKey(null)
    }
  }

  const createTaskHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!taskMarkdown.trim()) {
      setTaskError('La descripcion de la tarea es obligatoria.')
      return
    }

    if (taskAssigneeIds.length === 0) {
      setTaskError('Debes seleccionar al menos un empleado.')
      return
    }

    setSavingTask(true)
    setTaskError(null)

    try {
      const task = await createAdminTask({
        descriptionMarkdown: taskMarkdown,
        assigneeUserIds: taskAssigneeIds,
        files: taskFiles
      })
      setTaskMarkdown('')
      setTaskAssigneeIds([])
      setTaskFiles([])
      setActiveTab('pending')
      await loadTasks('pending')
      setSelectedTaskId(task.id)
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'No se pudo crear la tarea.')
    } finally {
      setSavingTask(false)
    }
  }

  const sendChatHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedTaskId) return

    if (!chatMarkdown.trim() && chatFiles.length === 0) {
      setDetailError('Debes escribir un mensaje o adjuntar un archivo.')
      return
    }

    setSendingChat(true)
    setDetailError(null)

    try {
      await createAdminTaskMessage({
        taskId: selectedTaskId,
        bodyMarkdown: chatMarkdown,
        files: chatFiles
      })
      setChatMarkdown('')
      setChatFiles([])
      await loadTaskDetail(selectedTaskId)
      await loadTasks()
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSendingChat(false)
    }
  }

  const toggleStatusHandler = async () => {
    if (!taskDetail || !selectedTaskId) return

    setUpdatingStatus(true)
    setDetailError(null)

    try {
      await updateAdminTaskStatus({
        taskId: selectedTaskId,
        isCompleted: taskDetail.status === 'pending'
      })
      await loadTasks()
      await loadTaskDetail(selectedTaskId)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo actualizar estado.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const deleteTaskHandler = async () => {
    if (!selectedTaskId) return

    const confirmed = window.confirm('Seguro que deseas eliminar esta tarea?')
    if (!confirmed) return

    setDeletingTask(true)
    setDetailError(null)

    try {
      await deleteAdminTask(selectedTaskId)
      setSelectedTaskId(null)
      setTaskDetail(null)
      setTaskMessages([])
      await loadTasks()
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'No se pudo eliminar tarea.')
    } finally {
      setDeletingTask(false)
    }
  }

  const renderAttachments = (input: {
    prefix: string
    taskId: string
    attachments: AttachmentLike[]
    messageId?: string
  }) => {
    if (input.attachments.length === 0) {
      return null
    }

    return (
      <div className="mt-3 space-y-2">
        {input.attachments.map((file) => {
          const key = `${input.prefix}-${file.id}`

          const previewLoader = () => {
            if (input.messageId) {
              return fetchAdminTaskMessageAttachmentBlob({
                taskId: input.taskId,
                messageId: input.messageId,
                fileId: file.id
              })
            }

            return fetchAdminTaskAttachmentBlob({
              taskId: input.taskId,
              fileId: file.id
            })
          }

          const downloadLoader = () => {
            if (input.messageId) {
              return fetchAdminTaskMessageAttachmentBlob({
                taskId: input.taskId,
                messageId: input.messageId,
                fileId: file.id,
                download: true
              })
            }

            return fetchAdminTaskAttachmentBlob({
              taskId: input.taskId,
              fileId: file.id,
              download: true
            })
          }

          return (
            <article key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-sm font-semibold text-slate-900">{file.original_name}</p>
              <p className="text-xs text-slate-500">{file.mime_type} - {formatFileSize(file.size_bytes)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() => {
                    void previewAttachment(previewLoader)
                  }}
                  disabled={!file.is_previewable}
                >
                  <Eye className="h-3.5 w-3.5" /><span className="ml-1">Ver</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() => {
                    void downloadAttachment({ key, fileName: file.original_name, loader: downloadLoader })
                  }}
                  disabled={downloadingKey === key}
                >
                  {downloadingKey === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="ml-1">Descargar</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/75 p-4">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isSuperAdmin ? 'Asignar tareas' : 'Tareas'}</h2>
            <p className="text-sm text-slate-600">
              {isSuperAdmin ? 'Crea tareas, asigna empleados y usa chat con archivos.' : 'Revisa tus tareas y responde por chat.'}
            </p>
          </div>
          <button type="button" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" onClick={props.onClose}><X className="h-4 w-4" /></button>
        </div>

        {taskError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{taskError}</p>}
        {detailError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</p>}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 p-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${activeTab === tab ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'all' ? 'Todas' : tab === 'pending' ? 'Pendientes' : 'Completadas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3">
              {loadingTasks ? (
                <p className="text-sm text-slate-500">Cargando tareas...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-slate-500">No hay tareas en este filtro.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <button key={task.id} type="button" className={`w-full rounded-lg border p-3 text-left ${selectedTaskId === task.id ? 'border-brand-700 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`} onClick={() => setSelectedTaskId(task.id)}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{task.status === 'completed' ? 'Completada' : 'Pendiente'}</span>
                        <span className="text-xs text-slate-500">{formatDateTime(task.created_at)}</span>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-800">{task.description_markdown}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white p-4">
            {isSuperAdmin && (
              <form className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3" onSubmit={createTaskHandler}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Nueva tarea</h3>

                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-600">Descripcion (Markdown)</label>
                <MarkdownToolbar onFormat={taskFormat} />
                <textarea
                  ref={taskEditorRef}
                  value={taskMarkdown}
                  onChange={(event) => setTaskMarkdown(event.target.value)}
                  className="input-base h-24 w-full resize-y border-slate-300 bg-white text-slate-900"
                  placeholder="Describe la tarea. Puedes usar markdown con los botones."
                />

                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-600">Empleados y rol</label>
                <select
                  multiple
                  value={taskAssigneeIds}
                  onChange={(event) => setTaskAssigneeIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
                  className="input-base mt-1 h-28 w-full border-slate-300 bg-white text-slate-900"
                  disabled={loadingAssignees}
                >
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.username} {assignee.role_name ? `(${assignee.role_name})` : '(Sin rol)'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">Seleccion multiple: Ctrl/Cmd + clic para asignar a varios.</p>

                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-600">Archivos adjuntos</label>
                <input
                  type="file"
                  multiple
                  onChange={(event) => setTaskFiles(Array.from(event.target.files ?? []))}
                  className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700"
                />

                <button type="submit" className="btn-primary mt-3" disabled={savingTask || loadingAssignees}>
                  {savingTask ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando tarea...</> : <><Paperclip className="mr-2 h-4 w-4" />Asignar tarea</>}
                </button>
              </form>
            )}

            {!selectedTaskId ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">Selecciona una tarea para ver detalle y chat.</p>
            ) : loadingDetail ? (
              <div className="flex items-center py-6 text-slate-600"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando detalle de tarea...</div>
            ) : taskDetail ? (
              <div className="space-y-4">
                <header className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${taskDetail.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {taskDetail.status === 'completed' ? 'Completada' : 'Pendiente'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(isSuperAdmin || taskDetail.status === 'pending') && (
                        <button type="button" className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white" onClick={() => { void toggleStatusHandler() }} disabled={updatingStatus}>
                          {updatingStatus ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Guardando...</> : taskDetail.status === 'pending' ? <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Marcar completada</> : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Volver a pendiente</>}
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button type="button" className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => { void deleteTaskHandler() }} disabled={deletingTask}>
                          {deletingTask ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Eliminando...</> : <><Trash2 className="mr-1.5 h-3.5 w-3.5" />Eliminar</>}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p><span className="font-semibold text-slate-800">Creada:</span> {formatDateTime(taskDetail.created_at)}</p>
                    <p><span className="font-semibold text-slate-800">Completada:</span> {formatDateTime(taskDetail.completed_at)}</p>
                    <p className="sm:col-span-2"><span className="font-semibold text-slate-800">Asignados:</span> {taskDetail.assignees.map((assignee) => assignee.role_name ? `${assignee.username} (${assignee.role_name})` : assignee.username).join(', ') || '-'}</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(taskDetail.description_markdown) }} />

                  {renderAttachments({ prefix: 'task', taskId: taskDetail.id, attachments: taskDetail.attachments })}
                </header>

                <section className="rounded-xl border border-slate-200 p-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Chat tarea</h3>

                  <div className="mt-3 max-h-[34vh] space-y-3 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {taskMessages.length === 0 ? (
                      <p className="text-sm text-slate-500">Todavia no hay mensajes en esta tarea.</p>
                    ) : (
                      taskMessages.map((message) => {
                        const ownMessage = message.sender_user?.id === props.currentUser.id

                        return (
                          <article key={message.id} className={`rounded-lg border px-3 py-2 ${ownMessage ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'}`}>
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                              <span>{message.sender_user?.username || 'Usuario eliminado'}{message.sender_user?.role_name ? ` (${message.sender_user.role_name})` : ''}</span>
                              <span>{formatDateTime(message.created_at)}</span>
                            </div>

                            {message.body_markdown && (
                              <div className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.body_markdown) }} />
                            )}

                            {renderAttachments({ prefix: `message-${message.id}`, taskId: taskDetail.id, messageId: message.id, attachments: message.attachments })}
                          </article>
                        )
                      })
                    )}
                  </div>

                  <form className="mt-3" onSubmit={sendChatHandler}>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Mensaje (Markdown)</label>
                    <MarkdownToolbar onFormat={chatFormat} />
                    <textarea
                      ref={chatEditorRef}
                      value={chatMarkdown}
                      onChange={(event) => setChatMarkdown(event.target.value)}
                      className="input-base h-20 w-full resize-y border-slate-300 bg-white text-slate-900"
                      placeholder="Escribe un mensaje para esta tarea..."
                    />

                    <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">Adjuntos del chat</label>
                    <input
                      type="file"
                      multiple
                      onChange={(event) => setChatFiles(Array.from(event.target.files ?? []))}
                      className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700"
                    />

                    <button type="submit" className="btn-primary mt-3" disabled={sendingChat}>
                      {sendingChat ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Send className="mr-2 h-4 w-4" />Enviar mensaje</>}
                    </button>
                  </form>
                </section>
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">No se pudo cargar esta tarea.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
