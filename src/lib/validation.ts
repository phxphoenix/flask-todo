import { z } from 'zod';
import {
  WorkspaceData,
  CategoryDTO,
  TagDTO,
  SubtaskDTO,
  ItemDTO,
} from '@/db/schema';

export const CategorySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, 'Nazwa kategorii jest wymagana').max(100),
  color: z.string().min(1).max(30).default('indigo'),
  icon: z.string().min(1).max(20).default('Folder'),
  created_at: z.string().optional(),
});

export const TagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, 'Nazwa tagu jest wymagana').max(60),
  color: z.string().min(1).max(30).default('indigo'),
});

export const SubtaskSchema = z.object({
  id: z.number().int().optional(),
  item_id: z.number().int().optional(),
  title: z.string().min(1, 'Treść podzadania nie może być pusta').max(255),
  done: z.boolean().default(false),
  position: z.number().int().default(0),
});

export const ItemSchema = z.object({
  id: z.number().int().optional(),
  type: z.enum(['TASK', 'NOTE']).default('TASK'),
  title: z.string().min(1, 'Tytuł jest wymagany').max(255),
  content_markdown: z.string().default(''),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  is_pinned: z.boolean().default(false),
  due_date: z.string().nullable().optional().default(null),
  category_id: z.number().int().nullable().optional().default(null),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  subtasks: z.array(SubtaskSchema).optional().default([]),
  tag_ids: z.array(z.number().int()).optional().default([]),
});

// Nowy pełny format eksportu/importu
export const ModernBackupSchema = z.object({
  version: z.string().optional(),
  exported_at: z.string().optional(),
  categories: z.array(CategorySchema).default([]),
  tags: z.array(TagSchema).default([]),
  items: z.array(ItemSchema).default([]),
});

// Stary format eksportu z aplikacji Flask (`tasks_backup.json`)
export const LegacyFlaskTaskSchema = z.object({
  id: z.number().int().optional(),
  content: z.string().min(1),
  done: z.boolean().default(false),
});

export const LegacyFlaskBackupSchema = z.array(LegacyFlaskTaskSchema);

export interface ValidatedImportResult {
  format: 'MODERN' | 'LEGACY_FLASK';
  data: WorkspaceData;
  summary: string;
}

export function parseAndValidateBackupJson(rawText: string): ValidatedImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Plik nie jest poprawnym dokumentem JSON (błąd składni).');
  }

  const nowIso = new Date().toISOString();

  // 1. Sprawdzenie czy to tablica ze starej aplikacji Flask: [{"id": 1, "content": "...", "done": false}]
  if (Array.isArray(parsed)) {
    const legacyResult = LegacyFlaskBackupSchema.safeParse(parsed);
    if (!legacyResult.success) {
      const firstIssue = legacyResult.error.issues[0];
      throw new Error(
        `Nieprawidłowy format starego pliku zadań (${firstIssue.path.join('.')}: ${firstIssue.message})`
      );
    }

    const convertedItems: ItemDTO[] = legacyResult.data.map((legacyTask, idx) => ({
      id: idx + 1,
      type: 'TASK',
      title: legacyTask.content.slice(0, 255),
      content_markdown:
        legacyTask.content.length > 255
          ? legacyTask.content
          : 'Zaimportowano ze starszej wersji aplikacji (`tasks_backup.json`).',
      status: legacyTask.done ? 'DONE' : 'TODO',
      priority: 'MEDIUM',
      is_pinned: false,
      due_date: null,
      category_id: null,
      created_at: nowIso,
      updated_at: nowIso,
      subtasks: [],
      tag_ids: [],
    }));

    return {
      format: 'LEGACY_FLASK',
      data: {
        categories: [],
        tags: [],
        items: convertedItems,
      },
      summary: `Skonwertowano i zaimportowano ${convertedItems.length} zadań ze starego formatu Flask!`,
    };
  }

  // 2. Walidacja nowego formatu grafu danych
  const modernResult = ModernBackupSchema.safeParse(parsed);
  if (!modernResult.success) {
    const firstIssue = modernResult.error.issues[0];
    throw new Error(
      `Błąd walidacji schematu Zod w polu "${firstIssue.path.join('.')}": ${firstIssue.message}`
    );
  }

  const payload = modernResult.data;

  // Mapowanie kluczy tymczasowych, aby nie psuć relacji ani sekwencji SERIAL
  const categories: CategoryDTO[] = payload.categories.map((c, idx) => ({
    id: c.id ?? idx + 1,
    name: c.name,
    color: c.color,
    icon: c.icon,
    created_at: c.created_at ?? nowIso,
  }));

  const tags: TagDTO[] = payload.tags.map((t, idx) => ({
    id: t.id ?? idx + 1,
    name: t.name,
    color: t.color,
  }));

  let subtaskCounter = 1;
  const items: ItemDTO[] = payload.items.map((item, idx) => {
    const itemId = item.id ?? idx + 1;
    const subtasks: SubtaskDTO[] = (item.subtasks ?? []).map((st, sIdx) => ({
      id: st.id ?? subtaskCounter++,
      item_id: itemId,
      title: st.title,
      done: st.done,
      position: st.position ?? sIdx,
    }));

    return {
      id: itemId,
      type: item.type,
      title: item.title,
      content_markdown: item.content_markdown ?? '',
      status: item.status,
      priority: item.priority,
      is_pinned: item.is_pinned ?? false,
      due_date: item.due_date ?? null,
      category_id: item.category_id ?? null,
      created_at: item.created_at ?? nowIso,
      updated_at: item.updated_at ?? nowIso,
      subtasks,
      tag_ids: item.tag_ids ?? [],
    };
  });

  return {
    format: 'MODERN',
    data: { categories, tags, items },
    summary: `Zaimportowano pomyślnie: ${items.length} elementów, ${categories.length} kategorii oraz ${tags.length} tagów.`,
  };
}
