'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Pin,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Flag,
  Folder,
  Tag as TagIcon,
  FileText,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  ItemDTO,
  CategoryDTO,
  TagDTO,
  ItemStatus,
  ItemPriority,
  ItemType,
} from '@/db/schema';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ItemDetailDrawerProps {
  item: ItemDTO | null;
  categories: CategoryDTO[];
  tags: TagDTO[];
  onClose: () => void;
  onUpdateItem: (id: number, patch: Partial<ItemDTO>) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onSubtaskAction: (
    itemId: number,
    action:
      | { type: 'ADD'; title: string }
      | { type: 'TOGGLE'; subtaskId: number }
      | { type: 'DELETE'; subtaskId: number }
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
}

const TAG_COLORS = ['indigo', 'emerald', 'rose', 'amber', 'violet', 'sky'];

export function ItemDetailDrawer({
  item,
  categories,
  tags,
  onClose,
  onUpdateItem,
  onDeleteItem,
  onSubtaskAction,
  onCreateTag,
}: ItemDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('indigo');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setMarkdown(item.content_markdown);
    }
  }, [item]);

  if (!item) return null;

  const completedSubtasks = item.subtasks.filter((s) => s.done).length;
  const totalSubtasks = item.subtasks.length;
  const subtaskProgress =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== item.title) {
      onUpdateItem(item.id, { title: title.trim() });
    }
  };

  const handleMarkdownBlur = () => {
    if (markdown !== item.content_markdown) {
      onUpdateItem(item.id, { content_markdown: markdown });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onSubtaskAction(item.id, { type: 'ADD', title: newSubtaskTitle.trim() });
    setNewSubtaskTitle('');
  };

  const handleToggleTag = async (tagId: number) => {
    const exists = item.tag_ids.includes(tagId);
    const nextTags = exists
      ? item.tag_ids.filter((id) => id !== tagId)
      : [...item.tag_ids, tagId];
    await onUpdateItem(item.id, { tag_ids: nextTags });
  };

  const handleAddNewTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await onCreateTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  const dueDateValue = item.due_date ? item.due_date.slice(0, 10) : '';

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-[2px]">
      <div
        className="fixed inset-0"
        onClick={() => {
          handleTitleBlur();
          handleMarkdownBlur();
          onClose();
        }}
      />
      <aside className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Górny pasek akcji */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <select
              value={item.type}
              onChange={(e) => onUpdateItem(item.id, { type: e.target.value as ItemType })}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 focus:outline-none"
            >
              <option value="TASK">☑️ Zadanie</option>
              <option value="NOTE">📝 Notatka</option>
            </select>
            <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateItem(item.id, { is_pinned: !item.is_pinned })}
              className={`p-2 rounded-lg border transition ${
                item.is_pinned
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={item.is_pinned ? 'Odepnij' : 'Przypnij na górze'}
            >
              <Pin className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await onDeleteItem(item.id);
                onClose();
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Usuń element"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                handleTitleBlur();
                handleMarkdownBlur();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition ml-1"
              title="Zamknij panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Główna zawartość przewijana */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tytuł */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Tytuł zadania lub notatki..."
              className="w-full text-xl sm:text-2xl font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-2 py-1 -mx-2"
            />
          </div>

          {/* Siatka metadanych: Status, Priorytet, Kategoria, Termin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status
              </span>
              <select
                value={item.status}
                onChange={(e) =>
                  onUpdateItem(item.id, { status: e.target.value as ItemStatus })
                }
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="TODO">Do zrobienia</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="DONE">Ukończone</option>
                <option value="ARCHIVED">Zarchiwizowane</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priorytet
              </span>
              <select
                value={item.priority}
                onChange={(e) =>
                  onUpdateItem(item.id, { priority: e.target.value as ItemPriority })
                }
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="LOW">🟢 Niski</option>
                <option value="MEDIUM">🟡 Średni</option>
                <option value="HIGH">🔴 Wysoki</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> Kategoria
              </span>
              <select
                value={item.category_id ?? ''}
                onChange={(e) =>
                  onUpdateItem(item.id, {
                    category_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="">Brak kategorii</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Termin
              </span>
              <input
                type="date"
                value={dueDateValue}
                onChange={(e) =>
                  onUpdateItem(item.id, {
                    due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Tagi */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" /> Tagi i Oznaczenia
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = item.tag_ids.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddNewTag} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nowy tag (np. pilne)..."
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
              >
                {TAG_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                + Utwórz tag
              </button>
            </form>
          </div>

          {/* Edytor Markdown z podglądem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Notatka / Opis (Markdown – bez limitu znaków)
              </label>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    editorMode === 'write'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> Edycja
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleMarkdownBlur();
                    setEditorMode('preview');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    editorMode === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Podgląd
                </button>
              </div>
            </div>

            {editorMode === 'write' ? (
              <textarea
                rows={8}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onBlur={handleMarkdownBlur}
                placeholder="Wpisz treść notatki lub szczegółowy opis zadania. Obsługuje nagłówki (#), pogrubienia (**tekst**), listy (- element) oraz bloki kodu (```)..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/50 min-h-[160px]">
                <MarkdownRenderer content={markdown} />
              </div>
            )}
          </div>

          {/* Lista podzadań (Subtasks / Checklista) */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Checklista / Podzadania ({completedSubtasks}/{totalSubtasks})
              </label>
              {totalSubtasks > 0 && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {subtaskProgress}% ukończono
                </span>
              )}
            </div>

            {totalSubtasks > 0 && (
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {item.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 group"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSubtaskAction(item.id, { type: 'TOGGLE', subtaskId: st.id })
                    }
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    {st.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        st.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSubtaskAction(item.id, { type: 'DELETE', subtaskId: st.id })
                    }
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-500 transition"
                    title="Usuń podzadanie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Dodaj kolejny krok na checkliście..."
                className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Dodaj
              </button>
            </form>
          </div>
        </div>

        {/* Stopka z informacją o czasie aktualizacji */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Utworzono:{' '}
            {new Date(item.created_at).toLocaleString('pl-PL')}
          </span>
          <span>
            Ostatnia zmiana: {new Date(item.updated_at).toLocaleString('pl-PL')}
          </span>
        </div>
      </aside>
    </div>
  );
}
