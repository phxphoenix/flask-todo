'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Pin,
  Plus,
  Search,
  Database,
  Download,
  Upload,
  Moon,
  Sun,
  Folder,
  Tag as TagIcon,
  FileText,
  CheckSquare,
  Calendar,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  Layers,
  Inbox,
  Code,
  BookOpen,
  Star,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import {
  WorkspaceData,
  ItemDTO,
  ItemType,
  ItemPriority,
  ItemStatus,
} from '@/db/schema';
import {
  getAllData,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
  manageSubtasks,
  manageCategories,
  manageTags,
  importValidatedWorkspaceData,
  getInitialSeedData,
} from '@/lib/storage';
import { parseAndValidateBackupJson } from '@/lib/validation';
import { NeonModal } from './NeonModal';
import { ItemDetailDrawer } from './ItemDetailDrawer';

type ViewFilter = 'ALL' | 'TASKS' | 'NOTES' | 'PINNED' | 'COMPLETED';
type SortOption = 'CREATED_DESC' | 'DUE_ASC' | 'PRIORITY_DESC';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const PRIORITY_BADGE: Record<
  ItemPriority,
  { label: string; classes: string; weight: number }
> = {
  HIGH: {
    label: 'Wysoki',
    classes:
      'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
    weight: 3,
  },
  MEDIUM: {
    label: 'Średni',
    classes:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    weight: 2,
  },
  LOW: {
    label: 'Niski',
    classes:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    weight: 1,
  },
};

export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => getInitialSeedData());
  const [storageMode, setStorageMode] = useState<'NEON' | 'LOCAL'>('LOCAL');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Nawigacja i filtry
  const [activeView, setActiveView] = useState<ViewFilter>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ItemPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('CREATED_DESC');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<ItemType>('TASK');
  const [quickPriority, setQuickPriority] = useState<ItemPriority>('MEDIUM');
  const [quickCategoryId, setQuickCategoryId] = useState<number | null>(1);

  // Nowa kategoria w pasku bocznym
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('indigo');

  // Panel boczny szczegółów i modal Neon
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isNeonModalOpen, setIsNeonModalOpen] = useState(false);

  // Powiadomienia Toast
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Inicjalizacja motywu i pobranie danych
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('flask_todo_theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    refreshData();
  }, []);

  // Skrót klawiszowy Ctrl+K / Cmd+K dla wyszukiwarki na żywo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('flask_todo_theme', next ? 'dark' : 'light');
  };

  const refreshData = async (overrideData?: WorkspaceData) => {
    setIsLoading(true);
    try {
      if (overrideData) {
        setWorkspace(overrideData);
        setStorageMode('NEON');
      } else {
        const res = await getAllData();
        setWorkspace(res.data);
        setStorageMode(res.mode);
        if (res.error) {
          addToast(res.error, 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Szybkie dodawanie zadania lub notatki
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      const created = await createItem({
        type: quickType,
        title: quickTitle.trim(),
        priority: quickPriority,
        category_id: quickCategoryId,
        status: 'TODO',
      });
      setWorkspace((prev) => ({
        ...prev,
        items: [created, ...prev.items],
      }));
      setQuickTitle('');
      addToast(
        created.type === 'TASK' ? 'Dodano nowe zadanie!' : 'Utworzono nową notatkę!',
        'success'
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Błąd podczas tworzenia elementu.',
        'error'
      );
    }
  };

  const handleToggleItemDone = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await toggleItemStatus(id);
      setWorkspace((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === id ? updated : it)),
      }));
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Nie udało się zmienić statusu.',
        'error'
      );
    }
  };

  const handleUpdateItem = async (id: number, patch: Partial<ItemDTO>) => {
    try {
      const updated = await updateItem(id, patch);
      setWorkspace((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === id ? updated : it)),
      }));
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Błąd zapisu zmian.',
        'error'
      );
    }
  };

  const handleDeleteItem = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteItem(id);
      setWorkspace((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== id),
      }));
      if (selectedItemId === id) {
        setSelectedItemId(null);
      }
      addToast('Usunięto element.', 'info');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Błąd podczas usuwania.',
        'error'
      );
    }
  };

  const handleSubtaskAction = async (
    itemId: number,
    action:
      | { type: 'ADD'; title: string }
      | { type: 'TOGGLE'; subtaskId: number }
      | { type: 'DELETE'; subtaskId: number }
  ) => {
    try {
      const updatedSubtasks = await manageSubtasks(itemId, action);
      setWorkspace((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId ? { ...it, subtasks: updatedSubtasks } : it
        ),
      }));
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Błąd aktualizacji podzadań.',
        'error'
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const updatedCategories = await manageCategories({
        type: 'ADD',
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'Folder',
      });
      setWorkspace((prev) => ({ ...prev, categories: updatedCategories }));
      setNewCatName('');
      setShowNewCategoryForm(false);
      addToast('Dodano nową kategorię!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Błąd tworzenia kategorii.', 'error');
    }
  };

  const handleDeleteCategory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedCategories = await manageCategories({ type: 'DELETE', id });
      setWorkspace((prev) => ({
        ...prev,
        categories: updatedCategories,
        items: prev.items.map((it) =>
          it.category_id === id ? { ...it, category_id: null } : it
        ),
      }));
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      addToast('Usunięto kategorię.', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Błąd usuwania kategorii.', 'error');
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const updatedTags = await manageTags({ type: 'ADD', name, color });
      setWorkspace((prev) => ({ ...prev, tags: updatedTags }));
      addToast(`Utworzono tag #${name}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Błąd tworzenia tagu.', 'error');
    }
  };

  // Eksport JSON w pamięci przeglądarki (Blob + URL.createObjectURL)
  const handleExportJson = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const payload = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      categories: workspace.categories,
      tags: workspace.tags,
      items: workspace.items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_tasks_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(`Pobrano kopię zapasową notes_tasks_backup_${dateStr}.json`, 'success');
  };

  // Import JSON z walidacją Zod oraz kompatybilnością wsteczną ze starym `tasks_backup.json`
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const validated = parseAndValidateBackupJson(text);
      const updatedWorkspace = await importValidatedWorkspaceData(validated.data, 'MERGE');
      setWorkspace(updatedWorkspace);
      addToast(validated.summary, 'success');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Nie udało się zaimportować pliku JSON.',
        'error'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Statystyki zadań
  const stats = useMemo(() => {
    const allTasks = workspace.items.filter((it) => it.type === 'TASK');
    const completedTasks = allTasks.filter((it) => it.status === 'DONE');
    const activeTasks = allTasks.filter((it) => it.status !== 'DONE');
    const notesCount = workspace.items.filter((it) => it.type === 'NOTE').length;
    const progressPercent =
      allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

    return {
      totalTasks: allTasks.length,
      completedCount: completedTasks.length,
      activeCount: activeTasks.length,
      notesCount,
      progressPercent,
    };
  }, [workspace.items]);

  // Filtrowanie i sortowanie na żywo
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return workspace.items
      .filter((item) => {
        if (activeView === 'TASKS' && item.type !== 'TASK') return false;
        if (activeView === 'NOTES' && item.type !== 'NOTE') return false;
        if (activeView === 'PINNED' && !item.is_pinned) return false;
        if (activeView === 'COMPLETED' && item.status !== 'DONE') return false;

        if (selectedCategoryId !== null && item.category_id !== selectedCategoryId) {
          return false;
        }
        if (selectedTagId !== null && !item.tag_ids.includes(selectedTagId)) {
          return false;
        }
        if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) {
          return false;
        }
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }

        if (q) {
          const inTitle = item.title.toLowerCase().includes(q);
          const inContent = item.content_markdown.toLowerCase().includes(q);
          const inSubtasks = item.subtasks.some((s) =>
            s.title.toLowerCase().includes(q)
          );
          if (!inTitle && !inContent && !inSubtasks) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Przypięte zawsze wyżej
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }

        if (sortBy === 'PRIORITY_DESC') {
          const diff =
            PRIORITY_BADGE[b.priority].weight - PRIORITY_BADGE[a.priority].weight;
          if (diff !== 0) return diff;
        } else if (sortBy === 'DUE_ASC') {
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    workspace.items,
    activeView,
    selectedCategoryId,
    selectedTagId,
    priorityFilter,
    statusFilter,
    sortBy,
    searchQuery,
  ]);

  const selectedItem = useMemo(
    () => workspace.items.find((it) => it.id === selectedItemId) ?? null,
    [workspace.items, selectedItemId]
  );

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Inbox':
        return <Inbox className="w-4 h-4 text-indigo-500" />;
      case 'Code':
        return <Code className="w-4 h-4 text-emerald-500" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      default:
        return <Folder className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Ukryty input do importu JSON */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Pasek boczny (Sidebar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo i nazwa projektu */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                Task & Note Hub
              </h1>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Next.js + Neon Serverless
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Karta postępu zadań */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/15 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-100">
            <span>Postęp wykonania zadań</span>
            <span className="font-bold text-white">{stats.progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-indigo-950/40 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-indigo-100 pt-0.5">
            <span>Aktywne: {stats.activeCount}</span>
            <span>Ukończone: {stats.completedCount}</span>
            <span>Notatki: {stats.notesCount}</span>
          </div>
        </div>

        {/* Nawigacja główna */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Widoki
            </p>
            {(
              [
                { id: 'ALL', label: 'Wszystkie elementy', icon: Layers, count: workspace.items.length },
                { id: 'TASKS', label: 'Zadania (Tasks)', icon: CheckSquare, count: stats.totalTasks },
                { id: 'NOTES', label: 'Notatki (Markdown)', icon: FileText, count: stats.notesCount },
                {
                  id: 'PINNED',
                  label: 'Przypięte',
                  icon: Star,
                  count: workspace.items.filter((i) => i.is_pinned).length,
                },
                { id: 'COMPLETED', label: 'Ukończone', icon: CheckCircle2, count: stats.completedCount },
              ] as const
            ).map((nav) => {
              const Icon = nav.icon;
              const isActive = activeView === nav.id && selectedCategoryId === null && selectedTagId === null;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveView(nav.id);
                    setSelectedCategoryId(null);
                    setSelectedTagId(null);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {nav.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {nav.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kategorie */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Kategorie / Przestrzenie
              </span>
              <button
                onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nowa
              </button>
            </div>

            {showNewCategoryForm && (
              <form
                onSubmit={handleCreateCategory}
                className="p-2.5 mx-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nazwa kategorii..."
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="px-2 py-1 rounded text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Szmaragdowy</option>
                    <option value="amber">Bursztynowy</option>
                    <option value="rose">Różowy</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    Dodaj
                  </button>
                </div>
              </form>
            )}

            {workspace.categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const count = workspace.items.filter((i) => i.category_id === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(isSelected ? null : cat.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {getCategoryIcon(cat.icon)}
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">{count}</span>
                    {workspace.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
                        title="Usuń kategorię"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tagi */}
          <div className="space-y-2 px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Filtruj po tagach
            </span>
            <div className="flex flex-wrap gap-1.5">
              {workspace.tags.map((tag) => {
                const active = selectedTagId === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(active ? null : tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dolny panel: Status bazy Neon oraz Eksport/Import JSON */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => setIsNeonModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 transition shadow-sm"
          >
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              🔌 Baza danych Neon
            </span>
            {storageMode === 'NEON' ? (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                🟢 Neon Cloud
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                💾 Lokalny
              </span>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Eksportuj pełny graf zadań i notatek do pliku JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              Eksport JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Importuj plik JSON (wspiera nowy format oraz stary tasks_backup.json)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              Import JSON
            </button>
          </div>
        </div>
      </aside>

      {/* Główny obszar roboczy */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Górny pasek narzędzi (Header) */}
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Wyszukiwarka na żywo (Ctrl+K) */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj w zadaniach, notatkach Markdown i podzadaniach... (Ctrl+K)"
                className="w-full pl-10 pr-16 py-2 rounded-xl text-sm bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Wyczyść
                </button>
              ) : (
                <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
                  Ctrl+K
                </kbd>
              )}
            </div>
          </div>

          {/* Prawa strona nagłówka: Status Neon + Dark Mode */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNeonModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                storageMode === 'NEON'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              {storageMode === 'NEON' ? '🟢 Neon Cloud' : '💾 Tryb Lokalny (Offline)'}
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition"
              title={darkMode ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Główny kontener z formularzem Quick Add, filtrami i listą */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Pasek szybkiego tworzenia (Quick Add) */}
          <form
            onSubmit={handleQuickAdd}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickType('TASK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    quickType === 'TASK'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Zadanie
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('NOTE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    quickType === 'NOTE'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Notatka
                </button>
              </div>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={
                  quickType === 'TASK'
                    ? 'Co jest do zrobienia? Wpisz tytuł zadania...'
                    : 'Tytuł nowej notatki Markdown...'
                }
                className="flex-1 px-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-sm transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                Dodaj {quickType === 'TASK' ? 'zadanie' : 'notatkę'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Domyślne parametry:</span>
                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as ItemPriority)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <option value="LOW">Priorytet: Niski</option>
                  <option value="MEDIUM">Priorytet: Średni</option>
                  <option value="HIGH">Priorytet: Wysoki</option>
                </select>

                <select
                  value={quickCategoryId ?? ''}
                  onChange={(e) =>
                    setQuickCategoryId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <option value="">Bez kategorii</option>
                  {workspace.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      Kategoria: {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-slate-400">
                Kliknij dowolny wiersz na liście, aby otworzyć edytor Markdown i podzadania
              </span>
            </div>
          </form>

          {/* Pasek zaawansowanych filtrów i sortowania */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filtry:
              </span>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'ALL')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="ALL">Status: Wszystkie</option>
                <option value="TODO">Do zrobienia</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="DONE">Ukończone</option>
                <option value="ARCHIVED">Zarchiwizowane</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as ItemPriority | 'ALL')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="ALL">Priorytet: Wszystkie</option>
                <option value="HIGH">🔴 Wysoki</option>
                <option value="MEDIUM">🟡 Średni</option>
                <option value="LOW">🟢 Niski</option>
              </select>

              {(selectedCategoryId !== null ||
                selectedTagId !== null ||
                priorityFilter !== 'ALL' ||
                statusFilter !== 'ALL' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSelectedTagId(null);
                    setPriorityFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Resetuj filtry
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sortuj:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="CREATED_DESC">Od najnowszych</option>
                <option value="PRIORITY_DESC">Według priorytetu</option>
                <option value="DUE_ASC">Według terminu wykonania</option>
              </select>
            </div>
          </div>

          {/* Lista Zadań i Notatek */}
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Ładowanie przestrzeni roboczej...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Brak elementów spełniających wybrane kryteria
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dodaj nowe zadanie lub notatkę powyżej albo wyczyść aktywne filtry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => {
                const isDone = item.status === 'DONE';
                const category = workspace.categories.find(
                  (c) => c.id === item.category_id
                );
                const itemTags = workspace.tags.filter((t) =>
                  item.tag_ids.includes(t.id)
                );
                const doneSubtasks = item.subtasks.filter((s) => s.done).length;
                const totalSubtasks = item.subtasks.length;
                const prio = PRIORITY_BADGE[item.priority];

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
                      selectedItemId === item.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox dla zadań lub ikona dla notatek */}
                      {item.type === 'TASK' ? (
                        <button
                          type="button"
                          onClick={(e) => handleToggleItemDone(item.id, e)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
                          title={isDone ? 'Oznacz jako nieukończone' : 'Oznacz jako ukończone'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <div className="mt-0.5 p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}

                      {/* Główna treść karty */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.is_pinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                                <Pin className="w-3 h-3" /> Przypięte
                              </span>
                            )}
                            <h3
                              className={`font-semibold text-sm sm:text-base ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${prio.classes}`}
                            >
                              {prio.label}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Usuń"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Zajawka opisu Markdown */}
                        {item.content_markdown && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.content_markdown.replace(/[#*`>-]/g, '').trim()}
                          </p>
                        )}

                        {/* Dolne badge: kategoria, podzadania, termin, tagi */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <Folder className="w-3 h-3 text-indigo-500" />
                              {category.name}
                            </span>
                          )}

                          {totalSubtasks > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                doneSubtasks === totalSubtasks
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <CheckSquare className="w-3 h-3" />
                              {doneSubtasks}/{totalSubtasks} kroków
                            </span>
                          )}

                          {item.due_date && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.due_date).toLocaleDateString('pl-PL')}
                            </span>
                          )}

                          {itemTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50"
                            >
                              <TagIcon className="w-2.5 h-2.5" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Panel boczny szczegółów i edycji na żywo (Slide-over Drawer) */}
      <ItemDetailDrawer
        item={selectedItem}
        categories={workspace.categories}
        tags={workspace.tags}
        onClose={() => setSelectedItemId(null)}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onSubtaskAction={handleSubtaskAction}
        onCreateTag={handleCreateTag}
      />

      {/* Modal konfiguracji bazy danych Neon PostgreSQL */}
      <NeonModal
        isOpen={isNeonModalOpen}
        onClose={() => setIsNeonModalOpen(false)}
        currentMode={storageMode}
        onConnectionChanged={refreshData}
        onToast={addToast}
      />

      {/* Kontener powiadomień Toast */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in slide-in-from-bottom-4 ${
              t.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : t.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-800'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
