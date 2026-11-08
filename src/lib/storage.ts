import { neon } from '@neondatabase/serverless';
import {
  WorkspaceData,
  CategoryDTO,
  TagDTO,
  SubtaskDTO,
  ItemDTO,
  ItemType,
  ItemStatus,
  ItemPriority,
} from '@/db/schema';

const LOCAL_STORAGE_KEY = 'flask_todo_next_workspace_v2';
const NEON_URL_STORAGE_KEY = 'flask_todo_neon_connection_url';

// Początkowe dane startowe (Seed) zawierające 5 oryginalnych zadań z `instance/tasks.db`
// oraz przykładowe kategorie, tagi i notatkę instruktażową.
export function getInitialSeedData(): WorkspaceData {
  const now = new Date().toISOString();
  return {
    categories: [
      { id: 1, name: 'Ogólne', color: 'indigo', icon: 'Inbox', created_at: now },
      { id: 2, name: 'Projekty IT', color: 'emerald', icon: 'Code', created_at: now },
      { id: 3, name: 'Baza Wiedzy', color: 'amber', icon: 'BookOpen', created_at: now },
    ],
    tags: [
      { id: 1, name: 'migracja-sqlite', color: 'indigo' },
      { id: 2, name: 'ważne', color: 'rose' },
      { id: 3, name: 'architektura', color: 'emerald' },
      { id: 4, name: 'markdown', color: 'violet' },
    ],
    items: [
      {
        id: 1,
        type: 'TASK',
        title: 'Zadanie 1',
        content_markdown:
          'Oryginalne zadanie wyekstrahowane ze starej bazy `instance/tasks.db` (`done: false`).\n\nMożesz teraz dodać podzadania, długi opis w **Markdown**, priorytet oraz tagi!',
        status: 'TODO',
        priority: 'HIGH',
        is_pinned: true,
        due_date: null,
        category_id: 1,
        created_at: now,
        updated_at: now,
        subtasks: [
          { id: 101, item_id: 1, title: 'Zweryfikować migrację ze starej bazy SQLite', done: true, position: 0 },
          { id: 102, item_id: 1, title: 'Dodać własne podzadania w panelu bocznym', done: false, position: 1 },
        ],
        tag_ids: [1, 2],
      },
      {
        id: 2,
        type: 'TASK',
        title: 'Zadanie 2',
        content_markdown: 'Drugie zadanie zachowane z bazy startowej `instance/tasks.db` (`done: false`).',
        status: 'TODO',
        priority: 'MEDIUM',
        is_pinned: false,
        due_date: null,
        category_id: 1,
        created_at: now,
        updated_at: now,
        subtasks: [],
        tag_ids: [1],
      },
      {
        id: 3,
        type: 'TASK',
        title: 'Zadanie 3',
        content_markdown: 'Trzecie zadanie zachowane z bazy startowej `instance/tasks.db` (`done: false`).',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        is_pinned: false,
        due_date: null,
        category_id: 2,
        created_at: now,
        updated_at: now,
        subtasks: [],
        tag_ids: [1],
      },
      {
        id: 4,
        type: 'TASK',
        title: 'Zadanie 4',
        content_markdown: 'Czwarte zadanie zachowane z bazy startowej `instance/tasks.db` (`done: true`).',
        status: 'DONE',
        priority: 'LOW',
        is_pinned: false,
        due_date: null,
        category_id: 1,
        created_at: now,
        updated_at: now,
        subtasks: [],
        tag_ids: [1],
      },
      {
        id: 5,
        type: 'TASK',
        title: 'Zadanie 5',
        content_markdown: 'Piąte zadanie zachowane z bazy startowej `instance/tasks.db` (`done: true`).',
        status: 'DONE',
        priority: 'LOW',
        is_pinned: false,
        due_date: null,
        category_id: 1,
        created_at: now,
        updated_at: now,
        subtasks: [],
        tag_ids: [1],
      },
      {
        id: 6,
        type: 'NOTE',
        title: 'Przewodnik po nowej architekturze (Notatki + Zadania + Neon DB)',
        content_markdown: `# Witaj w nowej aplikacji Zadania & Notatki 2.0! 🚀

Stara aplikacja Flask posiadała limit \`VARCHAR(200)\` oraz brak relacji. Teraz korzystasz z pełnego środowiska produktywności:

## Główne możliwości
- **Brak limitu znaków**: Twórz rozbudowane notatki techniczne i dokumentację w formacie **Markdown**.
- **Checklista / Podzadania**: Rozbijaj złożone projekty na mniejsze kroki z paskiem postępu.
- **Dual-Mode Storage Adapter**:
  1. **Tryb Lokalny (Offline-First)**: Działa natychmiast po otwarciu na GitHub Pages w \`localStorage\`.
  2. **Tryb Chmurowy (Neon PostgreSQL)**: Kliknij przycisk **„🔌 Baza danych Neon”** w nagłówku lub pasku bocznym, aby podłączyć darmową bazę Serverless Postgres i zsynchronizować tabele jednym kliknięciem!
- **Skróty klawiszowe**: Naciśnij \`Ctrl+K\` (lub \`Cmd+K\`), aby błyskawicznie przeszukać wszystkie zadania i notatki.`,
        status: 'TODO',
        priority: 'HIGH',
        is_pinned: true,
        due_date: null,
        category_id: 3,
        created_at: now,
        updated_at: now,
        subtasks: [
          { id: 103, item_id: 6, title: 'Przetestować edytor Markdown w panelu bocznym', done: true, position: 0 },
          { id: 104, item_id: 6, title: 'Sprawdzić eksport i import JSON z walidacją Zod', done: false, position: 1 },
        ],
        tag_ids: [3, 4],
      },
    ],
  };
}

// Zarządzanie kluczem połączenia Neon PostgreSQL
export function getConfiguredNeonUrl(): string | null {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(NEON_URL_STORAGE_KEY);
    if (stored && stored.trim().startsWith('postgres')) {
      return stored.trim();
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_DATABASE_URL;
  if (envUrl && envUrl.trim().startsWith('postgres')) {
    return envUrl.trim();
  }
  return null;
}

export function setConfiguredNeonUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    window.localStorage.removeItem(NEON_URL_STORAGE_KEY);
  } else {
    window.localStorage.setItem(NEON_URL_STORAGE_KEY, url.trim());
  }
}

// Odczyt i zapis w LocalStorage (Offline-First Fallback)
export function readLocalWorkspace(): WorkspaceData {
  if (typeof window === 'undefined') {
    return getInitialSeedData();
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const seed = getInitialSeedData();
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as WorkspaceData;
  } catch {
    return getInitialSeedData();
  }
}

export function writeLocalWorkspace(data: WorkspaceData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

// Pomocnik tworzący klienta HTTP Neon
function getNeonSql(customUrl?: string) {
  const url = customUrl ?? getConfiguredNeonUrl();
  if (!url) {
    throw new Error('Brak skonfigurowanego adresu połączenia Neon PostgreSQL.');
  }
  return neon(url);
}

// Tworzenie tabel w bazie Neon PostgreSQL
export async function ensureNeonTablesExist(customUrl?: string): Promise<void> {
  const sql = getNeonSql(customUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(30) NOT NULL,
      icon VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      type VARCHAR(10) NOT NULL DEFAULT 'TASK',
      title VARCHAR(255) NOT NULL,
      content_markdown TEXT NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'TODO',
      priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      due_date TIMESTAMPTZ NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subtasks (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      position INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL UNIQUE,
      color VARCHAR(30) NOT NULL DEFAULT 'indigo'
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    );
  `;
}

// Synchronizacja / Inicjalizacja tabel i wysyłka danych lokalnych do Neon PostgreSQL
export async function initializeAndSyncLocalToNeon(connectionUrl: string): Promise<WorkspaceData> {
  await ensureNeonTablesExist(connectionUrl);
  const localData = readLocalWorkspace();
  await syncWorkspaceDataToNeon(localData, connectionUrl, 'MERGE');
  setConfiguredNeonUrl(connectionUrl);
  return await fetchAllFromNeon(connectionUrl);
}

// Bezpieczny zapis grafu danych do Neon bez psucia sekwencji SERIAL
export async function syncWorkspaceDataToNeon(
  workspace: WorkspaceData,
  customUrl?: string,
  mode: 'MERGE' | 'REPLACE' = 'MERGE'
): Promise<void> {
  const sql = getNeonSql(customUrl);
  await ensureNeonTablesExist(customUrl);

  if (mode === 'REPLACE') {
    await sql`TRUNCATE TABLE item_tags, subtasks, items, tags, categories RESTART IDENTITY CASCADE`;
  }

  // Mapowanie starych ID kategorii -> nowe lub istniejące ID w Neon
  const categoryIdMap = new Map<number, number>();
  const existingCategories = (await sql`SELECT id, name FROM categories`) as Array<{
    id: number;
    name: string;
  }>;

  for (const cat of workspace.categories) {
    const found = existingCategories.find(
      (ec) => ec.name.toLowerCase() === cat.name.toLowerCase()
    );
    if (found) {
      categoryIdMap.set(cat.id, Number(found.id));
    } else {
      const inserted = (await sql`
        INSERT INTO categories (name, color, icon)
        VALUES (${cat.name}, ${cat.color}, ${cat.icon})
        RETURNING id
      `) as Array<{ id: number }>;
      categoryIdMap.set(cat.id, Number(inserted[0].id));
    }
  }

  // Mapowanie starych ID tagów -> nowe lub istniejące ID w Neon
  const tagIdMap = new Map<number, number>();
  const existingTags = (await sql`SELECT id, name FROM tags`) as Array<{
    id: number;
    name: string;
  }>;

  for (const tag of workspace.tags) {
    const found = existingTags.find(
      (et) => et.name.toLowerCase() === tag.name.toLowerCase()
    );
    if (found) {
      tagIdMap.set(tag.id, Number(found.id));
    } else {
      const inserted = (await sql`
        INSERT INTO tags (name, color)
        VALUES (${tag.name}, ${tag.color})
        ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
        RETURNING id
      `) as Array<{ id: number }>;
      tagIdMap.set(tag.id, Number(inserted[0].id));
    }
  }

  // Sprawdzenie istniejących tytułów przy trybie MERGE, aby nie duplikować zadań przy wielokrotnej synchronizacji
  const existingItems = (await sql`SELECT id, title, type FROM items`) as Array<{
    id: number;
    title: string;
    type: string;
  }>;

  for (const item of workspace.items) {
    if (
      mode === 'MERGE' &&
      existingItems.some((ei) => ei.title === item.title && ei.type === item.type)
    ) {
      continue;
    }

    const mappedCategoryId =
      item.category_id && categoryIdMap.has(item.category_id)
        ? categoryIdMap.get(item.category_id)!
        : null;

    // Wstawiamy bez sztywnego ID, pozwalając sekwencji SERIAL wygenerować bezpieczny klucz główny
    const insertedItem = (await sql`
      INSERT INTO items (
        type, title, content_markdown, status, priority, is_pinned, due_date, category_id
      ) VALUES (
        ${item.type},
        ${item.title},
        ${item.content_markdown},
        ${item.status},
        ${item.priority},
        ${item.is_pinned},
        ${item.due_date},
        ${mappedCategoryId}
      )
      RETURNING id
    `) as Array<{ id: number }>;

    const newItemId = Number(insertedItem[0].id);

    // Wstawienie podzadań
    for (let i = 0; i < (item.subtasks || []).length; i++) {
      const st = item.subtasks[i];
      await sql`
        INSERT INTO subtasks (item_id, title, done, position)
        VALUES (${newItemId}, ${st.title}, ${st.done}, ${st.position ?? i})
      `;
    }

    // Wstawienie powiązań item_tags
    for (const oldTagId of item.tag_ids || []) {
      const mappedTagId = tagIdMap.get(oldTagId);
      if (mappedTagId) {
        await sql`
          INSERT INTO item_tags (item_id, tag_id)
          VALUES (${newItemId}, ${mappedTagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }

  // Aktualizacja sekwencji SERIAL w PostgreSQL na wypadek operacji migracyjnych
  await sql`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), true)`;
  await sql`SELECT setval(pg_get_serial_sequence('tags', 'id'), COALESCE((SELECT MAX(id) FROM tags), 1), true)`;
  await sql`SELECT setval(pg_get_serial_sequence('items', 'id'), COALESCE((SELECT MAX(id) FROM items), 1), true)`;
  await sql`SELECT setval(pg_get_serial_sequence('subtasks', 'id'), COALESCE((SELECT MAX(id) FROM subtasks), 1), true)`;
}

async function fetchAllFromNeon(customUrl?: string): Promise<WorkspaceData> {
  const sql = getNeonSql(customUrl);

  const [catRows, tagRows, itemRows, subtaskRows, itemTagRows] = await Promise.all([
    sql`SELECT id, name, color, icon, created_at FROM categories ORDER BY id ASC`,
    sql`SELECT id, name, color FROM tags ORDER BY id ASC`,
    sql`SELECT id, type, title, content_markdown, status, priority, is_pinned, due_date, category_id, created_at, updated_at FROM items ORDER BY is_pinned DESC, created_at DESC, id DESC`,
    sql`SELECT id, item_id, title, done, position FROM subtasks ORDER BY position ASC, id ASC`,
    sql`SELECT item_id, tag_id FROM item_tags`,
  ]);

  const categories: CategoryDTO[] = (catRows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    color: String(r.color),
    icon: String(r.icon),
    created_at: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
  }));

  const tags: TagDTO[] = (tagRows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    color: String(r.color),
  }));

  const subtasksByItem = new Map<number, SubtaskDTO[]>();
  for (const r of subtaskRows as Record<string, unknown>[]) {
    const itemId = Number(r.item_id);
    const list = subtasksByItem.get(itemId) ?? [];
    list.push({
      id: Number(r.id),
      item_id: itemId,
      title: String(r.title),
      done: Boolean(r.done),
      position: Number(r.position ?? 0),
    });
    subtasksByItem.set(itemId, list);
  }

  const tagsByItem = new Map<number, number[]>();
  for (const r of itemTagRows as Record<string, unknown>[]) {
    const itemId = Number(r.item_id);
    const tagId = Number(r.tag_id);
    const list = tagsByItem.get(itemId) ?? [];
    list.push(tagId);
    tagsByItem.set(itemId, list);
  }

  const items: ItemDTO[] = (itemRows as Record<string, unknown>[]).map((r) => {
    const id = Number(r.id);
    return {
      id,
      type: (r.type as ItemType) || 'TASK',
      title: String(r.title),
      content_markdown: String(r.content_markdown ?? ''),
      status: (r.status as ItemStatus) || 'TODO',
      priority: (r.priority as ItemPriority) || 'MEDIUM',
      is_pinned: Boolean(r.is_pinned),
      due_date: r.due_date ? new Date(String(r.due_date)).toISOString() : null,
      category_id: r.category_id !== null && r.category_id !== undefined ? Number(r.category_id) : null,
      created_at: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
      updated_at: r.updated_at ? new Date(String(r.updated_at)).toISOString() : new Date().toISOString(),
      subtasks: subtasksByItem.get(id) ?? [],
      tag_ids: tagsByItem.get(id) ?? [],
    };
  });

  const data: WorkspaceData = { categories, tags, items };
  // Aktualizujemy też lokalny cache jako backup
  writeLocalWorkspace(data);
  return data;
}

// ============================================================================
// Zunifikowane asynchroniczne metody CRUD (Dual-Mode Storage Adapter)
// ============================================================================

export async function getAllData(): Promise<{
  data: WorkspaceData;
  mode: 'NEON' | 'LOCAL';
  error?: string;
}> {
  const neonUrl = getConfiguredNeonUrl();
  if (neonUrl) {
    try {
      const data = await fetchAllFromNeon(neonUrl);
      return { data, mode: 'NEON' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd połączenia z Neon DB';
      return {
        data: readLocalWorkspace(),
        mode: 'LOCAL',
        error: `Przełączono na tryb lokalny (błąd Neon: ${msg})`,
      };
    }
  }
  return { data: readLocalWorkspace(), mode: 'LOCAL' };
}

export interface CreateItemInput {
  type: ItemType;
  title: string;
  content_markdown?: string;
  status?: ItemStatus;
  priority?: ItemPriority;
  is_pinned?: boolean;
  due_date?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
}

export async function createItem(input: CreateItemInput): Promise<ItemDTO> {
  const now = new Date().toISOString();
  const neonUrl = getConfiguredNeonUrl();

  if (neonUrl) {
    const sql = getNeonSql(neonUrl);
    const rows = (await sql`
      INSERT INTO items (
        type, title, content_markdown, status, priority, is_pinned, due_date, category_id
      ) VALUES (
        ${input.type},
        ${input.title},
        ${input.content_markdown ?? ''},
        ${input.status ?? 'TODO'},
        ${input.priority ?? 'MEDIUM'},
        ${input.is_pinned ?? false},
        ${input.due_date ?? null},
        ${input.category_id ?? null}
      )
      RETURNING id, created_at, updated_at
    `) as Array<{ id: number; created_at: string; updated_at: string }>;

    const newId = Number(rows[0].id);
    const tagIds = input.tag_ids ?? [];
    for (const tagId of tagIds) {
      await sql`
        INSERT INTO item_tags (item_id, tag_id)
        VALUES (${newId}, ${tagId})
        ON CONFLICT DO NOTHING
      `;
    }

    const created: ItemDTO = {
      id: newId,
      type: input.type,
      title: input.title,
      content_markdown: input.content_markdown ?? '',
      status: input.status ?? 'TODO',
      priority: input.priority ?? 'MEDIUM',
      is_pinned: input.is_pinned ?? false,
      due_date: input.due_date ?? null,
      category_id: input.category_id ?? null,
      created_at: rows[0].created_at ? new Date(rows[0].created_at).toISOString() : now,
      updated_at: rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : now,
      subtasks: [],
      tag_ids: tagIds,
    };

    const current = readLocalWorkspace();
    writeLocalWorkspace({ ...current, items: [created, ...current.items] });
    return created;
  }

  // Tryb lokalny
  const current = readLocalWorkspace();
  const nextId = current.items.reduce((max, it) => Math.max(max, it.id), 0) + 1;
  const created: ItemDTO = {
    id: nextId,
    type: input.type,
    title: input.title,
    content_markdown: input.content_markdown ?? '',
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'MEDIUM',
    is_pinned: input.is_pinned ?? false,
    due_date: input.due_date ?? null,
    category_id: input.category_id ?? null,
    created_at: now,
    updated_at: now,
    subtasks: [],
    tag_ids: input.tag_ids ?? [],
  };

  writeLocalWorkspace({
    ...current,
    items: [created, ...current.items],
  });
  return created;
}

export async function updateItem(
  id: number,
  patch: Partial<
    Pick<
      ItemDTO,
      | 'type'
      | 'title'
      | 'content_markdown'
      | 'status'
      | 'priority'
      | 'is_pinned'
      | 'due_date'
      | 'category_id'
      | 'tag_ids'
    >
  >
): Promise<ItemDTO> {
  const now = new Date().toISOString();
  const current = readLocalWorkspace();
  const existing = current.items.find((it) => it.id === id);
  if (!existing) {
    throw new Error(`Nie znaleziono elementu o ID ${id}`);
  }

  const updated: ItemDTO = {
    ...existing,
    ...patch,
    updated_at: now,
  };

  const neonUrl = getConfiguredNeonUrl();
  if (neonUrl) {
    const sql = getNeonSql(neonUrl);
    await sql`
      UPDATE items
      SET
        type = ${updated.type},
        title = ${updated.title},
        content_markdown = ${updated.content_markdown},
        status = ${updated.status},
        priority = ${updated.priority},
        is_pinned = ${updated.is_pinned},
        due_date = ${updated.due_date},
        category_id = ${updated.category_id},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    if (patch.tag_ids !== undefined) {
      await sql`DELETE FROM item_tags WHERE item_id = ${id}`;
      for (const tagId of patch.tag_ids) {
        await sql`
          INSERT INTO item_tags (item_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }

  writeLocalWorkspace({
    ...current,
    items: current.items.map((it) => (it.id === id ? updated : it)),
  });

  return updated;
}

export async function deleteItem(id: number): Promise<void> {
  const neonUrl = getConfiguredNeonUrl();
  if (neonUrl) {
    const sql = getNeonSql(neonUrl);
    await sql`DELETE FROM items WHERE id = ${id}`;
  }

  const current = readLocalWorkspace();
  writeLocalWorkspace({
    ...current,
    items: current.items.filter((it) => it.id !== id),
  });
}

export async function toggleItemStatus(id: number): Promise<ItemDTO> {
  const current = readLocalWorkspace();
  const existing = current.items.find((it) => it.id === id);
  if (!existing) {
    throw new Error(`Nie znaleziono elementu o ID ${id}`);
  }
  const nextStatus: ItemStatus = existing.status === 'DONE' ? 'TODO' : 'DONE';
  return updateItem(id, { status: nextStatus });
}

export async function manageSubtasks(
  itemId: number,
  action:
    | { type: 'ADD'; title: string }
    | { type: 'TOGGLE'; subtaskId: number }
    | { type: 'DELETE'; subtaskId: number }
    | { type: 'UPDATE_TITLE'; subtaskId: number; title: string }
): Promise<SubtaskDTO[]> {
  const current = readLocalWorkspace();
  const item = current.items.find((it) => it.id === itemId);
  if (!item) {
    throw new Error(`Nie znaleziono elementu o ID ${itemId}`);
  }

  let updatedSubtasks = [...item.subtasks];
  const neonUrl = getConfiguredNeonUrl();

  if (action.type === 'ADD') {
    const nextPos = updatedSubtasks.length;
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      const rows = (await sql`
        INSERT INTO subtasks (item_id, title, done, position)
        VALUES (${itemId}, ${action.title}, false, ${nextPos})
        RETURNING id
      `) as Array<{ id: number }>;
      updatedSubtasks.push({
        id: Number(rows[0].id),
        item_id: itemId,
        title: action.title,
        done: false,
        position: nextPos,
      });
    } else {
      const maxSubId = current.items
        .flatMap((it) => it.subtasks)
        .reduce((m, s) => Math.max(m, s.id), 100);
      updatedSubtasks.push({
        id: maxSubId + 1,
        item_id: itemId,
        title: action.title,
        done: false,
        position: nextPos,
      });
    }
  } else if (action.type === 'TOGGLE') {
    const target = updatedSubtasks.find((s) => s.id === action.subtaskId);
    if (target) {
      const nextDone = !target.done;
      if (neonUrl) {
        const sql = getNeonSql(neonUrl);
        await sql`UPDATE subtasks SET done = ${nextDone} WHERE id = ${action.subtaskId}`;
      }
      updatedSubtasks = updatedSubtasks.map((s) =>
        s.id === action.subtaskId ? { ...s, done: nextDone } : s
      );
    }
  } else if (action.type === 'DELETE') {
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      await sql`DELETE FROM subtasks WHERE id = ${action.subtaskId}`;
    }
    updatedSubtasks = updatedSubtasks.filter((s) => s.id !== action.subtaskId);
  } else if (action.type === 'UPDATE_TITLE') {
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      await sql`UPDATE subtasks SET title = ${action.title} WHERE id = ${action.subtaskId}`;
    }
    updatedSubtasks = updatedSubtasks.map((s) =>
      s.id === action.subtaskId ? { ...s, title: action.title } : s
    );
  }

  const updatedItems = current.items.map((it) =>
    it.id === itemId ? { ...it, subtasks: updatedSubtasks, updated_at: new Date().toISOString() } : it
  );
  writeLocalWorkspace({ ...current, items: updatedItems });
  return updatedSubtasks;
}

export async function manageCategories(
  action:
    | { type: 'ADD'; name: string; color: string; icon: string }
    | { type: 'DELETE'; id: number }
): Promise<CategoryDTO[]> {
  const current = readLocalWorkspace();
  const neonUrl = getConfiguredNeonUrl();

  if (action.type === 'ADD') {
    const now = new Date().toISOString();
    let newCat: CategoryDTO;

    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      const rows = (await sql`
        INSERT INTO categories (name, color, icon)
        VALUES (${action.name}, ${action.color}, ${action.icon})
        RETURNING id, created_at
      `) as Array<{ id: number; created_at: string }>;
      newCat = {
        id: Number(rows[0].id),
        name: action.name,
        color: action.color,
        icon: action.icon,
        created_at: rows[0].created_at ? new Date(rows[0].created_at).toISOString() : now,
      };
    } else {
      const nextId = current.categories.reduce((m, c) => Math.max(m, c.id), 0) + 1;
      newCat = {
        id: nextId,
        name: action.name,
        color: action.color,
        icon: action.icon,
        created_at: now,
      };
    }

    const updatedCategories = [...current.categories, newCat];
    writeLocalWorkspace({ ...current, categories: updatedCategories });
    return updatedCategories;
  } else {
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      await sql`DELETE FROM categories WHERE id = ${action.id}`;
    }
    const updatedCategories = current.categories.filter((c) => c.id !== action.id);
    const updatedItems = current.items.map((it) =>
      it.category_id === action.id ? { ...it, category_id: null } : it
    );
    writeLocalWorkspace({
      ...current,
      categories: updatedCategories,
      items: updatedItems,
    });
    return updatedCategories;
  }
}

export async function manageTags(
  action:
    | { type: 'ADD'; name: string; color: string }
    | { type: 'DELETE'; id: number }
): Promise<TagDTO[]> {
  const current = readLocalWorkspace();
  const neonUrl = getConfiguredNeonUrl();

  if (action.type === 'ADD') {
    const cleanName = action.name.trim().toLowerCase();
    const existing = current.tags.find((t) => t.name.toLowerCase() === cleanName);
    if (existing) return current.tags;

    let newTag: TagDTO;
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      const rows = (await sql`
        INSERT INTO tags (name, color)
        VALUES (${cleanName}, ${action.color})
        ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
        RETURNING id
      `) as Array<{ id: number }>;
      newTag = {
        id: Number(rows[0].id),
        name: cleanName,
        color: action.color,
      };
    } else {
      const nextId = current.tags.reduce((m, t) => Math.max(m, t.id), 0) + 1;
      newTag = {
        id: nextId,
        name: cleanName,
        color: action.color,
      };
    }

    const updatedTags = [...current.tags, newTag];
    writeLocalWorkspace({ ...current, tags: updatedTags });
    return updatedTags;
  } else {
    if (neonUrl) {
      const sql = getNeonSql(neonUrl);
      await sql`DELETE FROM tags WHERE id = ${action.id}`;
    }
    const updatedTags = current.tags.filter((t) => t.id !== action.id);
    const updatedItems = current.items.map((it) => ({
      ...it,
      tag_ids: it.tag_ids.filter((tid) => tid !== action.id),
    }));
    writeLocalWorkspace({
      ...current,
      tags: updatedTags,
      items: updatedItems,
    });
    return updatedTags;
  }
}

// Bezpieczny import całego grafu danych (lokalnie + do Neon jeśli skonfigurowano)
export async function importValidatedWorkspaceData(
  imported: WorkspaceData,
  mode: 'MERGE' | 'REPLACE' = 'MERGE'
): Promise<WorkspaceData> {
  const neonUrl = getConfiguredNeonUrl();
  if (neonUrl) {
    await syncWorkspaceDataToNeon(imported, neonUrl, mode);
    return await fetchAllFromNeon(neonUrl);
  }

  // Import w trybie lokalnym z bezpiecznym przeliczeniem sekwencji ID
  const current = mode === 'REPLACE' ? { categories: [], tags: [], items: [] } : readLocalWorkspace();

  const categoryIdMap = new Map<number, number>();
  const mergedCategories = [...current.categories];
  let nextCatId = mergedCategories.reduce((m, c) => Math.max(m, c.id), 0) + 1;

  for (const cat of imported.categories) {
    const found = mergedCategories.find((c) => c.name.toLowerCase() === cat.name.toLowerCase());
    if (found) {
      categoryIdMap.set(cat.id, found.id);
    } else {
      const assignedId = nextCatId++;
      categoryIdMap.set(cat.id, assignedId);
      mergedCategories.push({ ...cat, id: assignedId });
    }
  }

  const tagIdMap = new Map<number, number>();
  const mergedTags = [...current.tags];
  let nextTagId = mergedTags.reduce((m, t) => Math.max(m, t.id), 0) + 1;

  for (const tag of imported.tags) {
    const found = mergedTags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase());
    if (found) {
      tagIdMap.set(tag.id, found.id);
    } else {
      const assignedId = nextTagId++;
      tagIdMap.set(tag.id, assignedId);
      mergedTags.push({ ...tag, id: assignedId });
    }
  }

  const mergedItems = [...current.items];
  let nextItemId = mergedItems.reduce((m, it) => Math.max(m, it.id), 0) + 1;
  let nextSubtaskId =
    mergedItems.flatMap((it) => it.subtasks).reduce((m, s) => Math.max(m, s.id), 100) + 1;

  for (const item of imported.items) {
    const assignedItemId = nextItemId++;
    const mappedCategoryId =
      item.category_id && categoryIdMap.has(item.category_id)
        ? categoryIdMap.get(item.category_id)!
        : item.category_id && mergedCategories.some((c) => c.id === item.category_id)
          ? item.category_id
          : null;

    const mappedTagIds = (item.tag_ids || [])
      .map((oldId) => tagIdMap.get(oldId) ?? (mergedTags.some((t) => t.id === oldId) ? oldId : null))
      .filter((id): id is number => id !== null);

    const mappedSubtasks: SubtaskDTO[] = (item.subtasks || []).map((st, idx) => ({
      id: nextSubtaskId++,
      item_id: assignedItemId,
      title: st.title,
      done: st.done,
      position: st.position ?? idx,
    }));

    mergedItems.unshift({
      ...item,
      id: assignedItemId,
      category_id: mappedCategoryId,
      tag_ids: mappedTagIds,
      subtasks: mappedSubtasks,
    });
  }

  const result: WorkspaceData = {
    categories: mergedCategories,
    tags: mergedTags,
    items: mergedItems,
  };

  writeLocalWorkspace(result);
  return result;
}
