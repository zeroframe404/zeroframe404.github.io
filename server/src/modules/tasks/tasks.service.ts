import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { normalizeLimit } from '../../utils/validation/common.js'
import { prisma } from '../db/prisma.js'
import type { AdminSessionContext } from '../admin/admin.types.js'
import type {
  AdminTaskAssigneeRow,
  AdminTaskAttachmentRow,
  AdminTaskDetailResponse,
  AdminTaskListResponse,
  AdminTaskMessageAttachmentRow,
  AdminTaskMessageRow,
  AdminTaskRow,
  AdminTaskStatus,
  AdminTaskUserSummary
} from './tasks.types.js'

export interface AdminTaskUploadFileInput {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

export interface AdminTaskFileContent {
  id: string
  originalName: string
  mimeType: string
  content: Buffer
}

const DEFAULT_TASK_LIMIT = 200
const DEFAULT_TASK_MESSAGE_LIMIT = 300
const MAX_TASK_LIMIT = 1000

const taskListInclude = {
  createdByUser: {
    include: {
      role: true
    }
  },
  completedByUser: {
    include: {
      role: true
    }
  },
  assignments: {
    include: {
      user: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  },
  attachments: {
    include: {
      uploaderUser: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  },
  _count: {
    select: {
      messages: true
    }
  },
  messages: {
    select: {
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 1
  }
} satisfies Prisma.AdminTaskInclude

const taskMessageInclude = {
  senderUser: {
    include: {
      role: true
    }
  },
  attachments: {
    include: {
      uploaderUser: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  }
} satisfies Prisma.AdminTaskMessageInclude

type TaskRowWithRelations = Prisma.AdminTaskGetPayload<{
  include: typeof taskListInclude
}>

type TaskMessageWithRelations = Prisma.AdminTaskMessageGetPayload<{
  include: typeof taskMessageInclude
}>

type TaskAttachmentWithUploader = Prisma.AdminTaskAttachmentGetPayload<{
  include: {
    uploaderUser: {
      include: {
        role: true
      }
    }
  }
}>

type TaskMessageAttachmentWithUploader = Prisma.AdminTaskMessageAttachmentGetPayload<{
  include: {
    uploaderUser: {
      include: {
        role: true
      }
    }
  }
}>

function getTaskAccessWhere(session: AdminSessionContext): Prisma.AdminTaskWhereInput {
  if (session.user.is_super_admin) {
    return {}
  }

  return {
    assignments: {
      some: {
        userId: session.user.id
      }
    }
  }
}

function toPrismaBytes(content: Buffer) {
  return new Uint8Array(content)
}

function calculateSha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex')
}

function normalizeTaskStatus(rawStatus: unknown): AdminTaskStatus | null {
  if (rawStatus === 'pending' || rawStatus === 'completed') {
    return rawStatus
  }

  return null
}

function isPreviewableMimeType(rawMimeType: string) {
  const mimeType = rawMimeType.toLowerCase()
  if (mimeType.startsWith('image/')) {
    return true
  }

  if (mimeType.startsWith('video/')) {
    return true
  }

  if (mimeType.startsWith('audio/')) {
    return true
  }

  if (mimeType === 'application/pdf') {
    return true
  }

  if (mimeType.startsWith('text/')) {
    return true
  }

  if (
    mimeType === 'application/json' ||
    mimeType.endsWith('+json') ||
    mimeType === 'application/xml' ||
    mimeType.endsWith('+xml')
  ) {
    return true
  }

  return false
}

function mapUserSummary(
  user:
    | {
        id: string
        username: string
        role: {
          name: string
        } | null
      }
    | null
): AdminTaskUserSummary | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    role_name: user.role?.name ?? null
  }
}

function mapTaskAttachment(attachment: TaskAttachmentWithUploader): AdminTaskAttachmentRow {
  return {
    id: attachment.id,
    created_at: attachment.createdAt.toISOString(),
    original_name: attachment.originalName,
    mime_type: attachment.mimeType,
    size_bytes: attachment.sizeBytes,
    is_previewable: isPreviewableMimeType(attachment.mimeType),
    uploader_user: mapUserSummary(attachment.uploaderUser)
  }
}

function mapTaskMessageAttachment(
  attachment: TaskMessageAttachmentWithUploader
): AdminTaskMessageAttachmentRow {
  return {
    id: attachment.id,
    created_at: attachment.createdAt.toISOString(),
    original_name: attachment.originalName,
    mime_type: attachment.mimeType,
    size_bytes: attachment.sizeBytes,
    is_previewable: isPreviewableMimeType(attachment.mimeType),
    uploader_user: mapUserSummary(attachment.uploaderUser)
  }
}

function mapTaskMessage(message: TaskMessageWithRelations): AdminTaskMessageRow {
  return {
    id: message.id,
    created_at: message.createdAt.toISOString(),
    body_markdown: message.bodyMarkdown ?? '',
    sender_user: mapUserSummary(message.senderUser),
    attachments: message.attachments.map(mapTaskMessageAttachment)
  }
}

function mapTask(task: TaskRowWithRelations): AdminTaskRow {
  return {
    id: task.id,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
    description_markdown: task.descriptionMarkdown,
    status: task.completedAt ? 'completed' : 'pending',
    completed_at: task.completedAt ? task.completedAt.toISOString() : null,
    created_by_user: mapUserSummary(task.createdByUser),
    completed_by_user: mapUserSummary(task.completedByUser),
    assignees: task.assignments
      .map((assignment) => mapUserSummary(assignment.user))
      .filter((user): user is AdminTaskUserSummary => Boolean(user)),
    attachments: task.attachments.map(mapTaskAttachment),
    message_count: task._count.messages,
    last_message_at: task.messages[0]?.createdAt.toISOString() ?? null
  }
}

async function getTaskByIdForUser(input: {
  taskId: string
  session: AdminSessionContext
}): Promise<TaskRowWithRelations | null> {
  const accessWhere = getTaskAccessWhere(input.session)

  return prisma.adminTask.findFirst({
    where: {
      id: input.taskId,
      ...accessWhere
    },
    include: taskListInclude
  })
}

export async function getAdminTaskAssignees(
  session: AdminSessionContext
): Promise<AdminTaskAssigneeRow[]> {
  if (!session.user.is_super_admin) {
    throw new Error('Solo el administrador puede asignar tareas.')
  }

  const users = await prisma.adminUser.findMany({
    where: {
      isSuperAdmin: false,
      isActive: true
    },
    orderBy: [{ username: 'asc' }],
    include: {
      role: true
    }
  })

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    role_name: user.role?.name ?? null
  }))
}

export async function listAdminTasks(input: {
  session: AdminSessionContext
  rawStatus?: unknown
  rawLimit?: unknown
}): Promise<AdminTaskListResponse> {
  const status = normalizeTaskStatus(input.rawStatus)
  const limit = normalizeLimit(input.rawLimit, DEFAULT_TASK_LIMIT, MAX_TASK_LIMIT)

  const filters: Prisma.AdminTaskWhereInput[] = [getTaskAccessWhere(input.session)]

  if (status === 'pending') {
    filters.push({
      completedAt: null
    })
  }

  if (status === 'completed') {
    filters.push({
      completedAt: {
        not: null
      }
    })
  }

  const where: Prisma.AdminTaskWhereInput = {
    AND: filters
  }

  const tasks = await prisma.adminTask.findMany({
    where,
    include: taskListInclude,
    orderBy: [{ createdAt: 'desc' }],
    take: limit
  })

  return {
    tasks: tasks.map(mapTask)
  }
}

export async function createAdminTask(input: {
  session: AdminSessionContext
  descriptionMarkdown: string
  assigneeUserIds: string[]
  files: AdminTaskUploadFileInput[]
}): Promise<AdminTaskRow> {
  if (!input.session.user.is_super_admin) {
    throw new Error('Solo el administrador puede crear tareas.')
  }

  const descriptionMarkdown = input.descriptionMarkdown.trim()
  if (!descriptionMarkdown) {
    throw new Error('La descripcion de la tarea es obligatoria.')
  }

  const assigneeUserIds = Array.from(
    new Set(
      input.assigneeUserIds
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  )

  if (assigneeUserIds.length === 0) {
    throw new Error('Debes seleccionar al menos un empleado para asignar la tarea.')
  }

  const existingAssignees = await prisma.adminUser.findMany({
    where: {
      id: {
        in: assigneeUserIds
      },
      isSuperAdmin: false,
      isActive: true
    },
    select: {
      id: true
    }
  })

  if (existingAssignees.length !== assigneeUserIds.length) {
    throw new Error('Uno o mas empleados seleccionados no son validos.')
  }

  const created = await prisma.adminTask.create({
    data: {
      descriptionMarkdown,
      createdByUserId: input.session.user.id,
      assignments: {
        create: assigneeUserIds.map((userId) => ({
          userId
        }))
      },
      ...(input.files.length > 0
        ? {
            attachments: {
              create: input.files.map((file) => ({
                uploaderUserId: input.session.user.id,
                originalName: file.originalname || 'archivo',
                mimeType: file.mimetype || 'application/octet-stream',
                sizeBytes: file.size,
                fileData: toPrismaBytes(file.buffer),
                fileSha256: calculateSha256(file.buffer)
              }))
            }
          }
        : {})
    },
    include: taskListInclude
  })

  return mapTask(created)
}

export async function getAdminTaskDetail(input: {
  session: AdminSessionContext
  taskId: string
  rawMessageLimit?: unknown
}): Promise<AdminTaskDetailResponse | null> {
  const task = await getTaskByIdForUser({
    taskId: input.taskId,
    session: input.session
  })

  if (!task) {
    return null
  }

  const messageLimit = normalizeLimit(
    input.rawMessageLimit,
    DEFAULT_TASK_MESSAGE_LIMIT,
    MAX_TASK_LIMIT
  )

  const messagesDesc = await prisma.adminTaskMessage.findMany({
    where: {
      taskId: task.id
    },
    include: taskMessageInclude,
    orderBy: [{ createdAt: 'desc' }],
    take: messageLimit
  })

  const messages = [...messagesDesc].reverse().map(mapTaskMessage)

  return {
    task: mapTask(task),
    messages
  }
}

export async function setAdminTaskStatus(input: {
  session: AdminSessionContext
  taskId: string
  isCompleted: boolean
}): Promise<AdminTaskRow | null> {
  const existingTask = await getTaskByIdForUser({
    taskId: input.taskId,
    session: input.session
  })

  if (!existingTask) {
    return null
  }

  if (!input.session.user.is_super_admin && !input.isCompleted) {
    throw new Error('Solo el administrador puede volver una tarea a pendiente.')
  }

  const updated = await prisma.adminTask.update({
    where: {
      id: existingTask.id
    },
    data: input.isCompleted
      ? {
          completedAt: new Date(),
          completedByUserId: input.session.user.id
        }
      : {
          completedAt: null,
          completedByUserId: null
        },
    include: taskListInclude
  })

  return mapTask(updated)
}

export async function deleteAdminTask(input: {
  session: AdminSessionContext
  taskId: string
}) {
  if (!input.session.user.is_super_admin) {
    throw new Error('Solo el administrador puede eliminar tareas.')
  }

  const result = await prisma.adminTask.deleteMany({
    where: {
      id: input.taskId
    }
  })

  return result.count > 0
}

export async function createAdminTaskMessage(input: {
  session: AdminSessionContext
  taskId: string
  bodyMarkdown: string
  files: AdminTaskUploadFileInput[]
}): Promise<AdminTaskMessageRow | null> {
  const task = await getTaskByIdForUser({
    taskId: input.taskId,
    session: input.session
  })

  if (!task) {
    return null
  }

  const bodyMarkdown = input.bodyMarkdown.trim()
  if (!bodyMarkdown && input.files.length === 0) {
    throw new Error('Debes escribir un mensaje o adjuntar al menos un archivo.')
  }

  const createdMessage = await prisma.adminTaskMessage.create({
    data: {
      taskId: task.id,
      senderUserId: input.session.user.id,
      bodyMarkdown: bodyMarkdown || null,
      ...(input.files.length > 0
        ? {
            attachments: {
              create: input.files.map((file) => ({
                uploaderUserId: input.session.user.id,
                originalName: file.originalname || 'archivo',
                mimeType: file.mimetype || 'application/octet-stream',
                sizeBytes: file.size,
                fileData: toPrismaBytes(file.buffer),
                fileSha256: calculateSha256(file.buffer)
              }))
            }
          }
        : {})
    },
    include: taskMessageInclude
  })

  await prisma.adminTask.update({
    where: {
      id: task.id
    },
    data: {
      updatedAt: new Date()
    }
  })

  return mapTaskMessage(createdMessage)
}

export async function getAdminTaskAttachmentContent(input: {
  session: AdminSessionContext
  taskId: string
  fileId: string
}): Promise<AdminTaskFileContent | null> {
  const where: Prisma.AdminTaskAttachmentWhereInput = {
    id: input.fileId,
    taskId: input.taskId,
    ...(input.session.user.is_super_admin
      ? {}
      : {
          task: {
            assignments: {
              some: {
                userId: input.session.user.id
              }
            }
          }
        })
  }

  const attachment = await prisma.adminTaskAttachment.findFirst({
    where
  })

  if (!attachment) {
    return null
  }

  return {
    id: attachment.id,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    content: Buffer.from(attachment.fileData)
  }
}

export async function getAdminTaskMessageAttachmentContent(input: {
  session: AdminSessionContext
  taskId: string
  messageId: string
  fileId: string
}): Promise<AdminTaskFileContent | null> {
  const where: Prisma.AdminTaskMessageAttachmentWhereInput = {
    id: input.fileId,
    messageId: input.messageId,
    message: {
      is: {
        taskId: input.taskId,
        ...(input.session.user.is_super_admin
          ? {}
          : {
              task: {
                assignments: {
                  some: {
                    userId: input.session.user.id
                  }
                }
              }
            })
      }
    }
  }

  const attachment = await prisma.adminTaskMessageAttachment.findFirst({
    where
  })

  if (!attachment) {
    return null
  }

  return {
    id: attachment.id,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    content: Buffer.from(attachment.fileData)
  }
}
