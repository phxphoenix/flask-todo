'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  Cloud,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { NEON_SCHEMA_SQL, WorkspaceData } from '@/db/schema';
import {
  getConfiguredNeonUrl,
  setConfiguredNeonUrl,
  initializeAndSyncLocalToNeon,
  ensureNeonTablesExist,
} from '@/lib/storage';

interface NeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'NEON' | 'LOCAL';
  onConnectionChanged: (newData?: WorkspaceData) => Promise<void>;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function NeonModal({
  isOpen,
  onClose,
  currentMode,
  onConnectionChanged,
  onToast,
}: NeonModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'sql'>('connect');

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getConfiguredNeonUrl() ?? '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
      onToast(
        'Podaj prawidłowy Connection String zaczynający się od postgresql:// lub postgres://',
        'error'
      );
      return;
    }

    setIsSyncing(true);
    try {
      const syncedData = await initializeAndSyncLocalToNeon(trimmed);
      await onConnectionChanged(syncedData);
      onToast(
        'Połączono z Neon PostgreSQL! Tabele zostały utworzone, a lokalne dane zsynchronizowane.',
        'success'
      );
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się połączyć z bazą Neon.';
      onToast(`Błąd Neon DB: ${msg}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectOnly = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
      onToast('Podaj prawidłowy Connection String zaczynający się od postgresql://', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      await ensureNeonTablesExist(trimmed);
      setConfiguredNeonUrl(trimmed);
      await onConnectionChanged();
      onToast('Połączono z bazą Neon PostgreSQL!', 'success');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd połączenia z bazą Neon.';
      onToast(`Błąd połączenia: ${msg}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setConfiguredNeonUrl(null);
    setUrlInput('');
    await onConnectionChanged();
    onToast('Odłączono bazę Neon. Aplikacja działa teraz w Trybie Lokalnym (Offline).', 'info');
    onClose();
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(NEON_SCHEMA_SQL);
    setCopiedSql(true);
    onToast('Skopiowano skrypt SQL schematu do schowka!', 'info');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Nagłówek modala */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🔌 Konfiguracja Neon PostgreSQL
                {currentMode === 'NEON' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800">
                    <Cloud className="w-3 h-3" /> Aktywne połączenie Neon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50 dark:border-amber-800">
                    <HardDrive className="w-3 h-3" /> Tryb Lokalny (Offline)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dual-Mode Storage Adapter: Bezpośrednia komunikacja HTTPS (`@neondatabase/serverless`) lub pamięć przeglądarki
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zakładki */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/40 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'connect'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Połączenie i Synchronizacja
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            2. Instrukcja Krok po Kroku & Skrypt SQL
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {activeTab === 'connect' ? (
            <>
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <p className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Jak działa bezpieczny tryb hybrydowy na GitHub Pages?
                </p>
                <p>
                  Ponieważ GitHub Pages to hosting statyczny, tajny klucz bazy danych nigdy nie jest zaszyty w publicznym kodzie repozytorium. Twój Connection String jest zapisywany <strong>wyłącznie lokalnie w Twojej przeglądarce</strong> (`localStorage`) i używany do połączenia przez szyfrowany sterownik HTTP Neon.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Neon PostgreSQL Connection String (`DATABASE_URL`)
                </label>
                <input
                  type="password"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="postgresql://neondb_owner:haslo@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wklej adres z zakładki <strong>Dashboard → Connect</strong> w panelu <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">neon.tech</a>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Zainicjuj tabele i wyślij lokalne dane do Neon
                </button>

                <button
                  onClick={handleConnectOnly}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition"
                >
                  Tylko połącz
                </button>
              </div>

              {currentMode === 'NEON' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Chcesz wrócić do pracy wyłącznie w pamięci przeglądarki?
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Odłącz bazę Neon
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Instrukcja konfiguracji darmowej bazy danych Neon Serverless PostgreSQL:
                </p>
                <ol className="list-decimal ml-5 space-y-1.5">
                  <li>
                    Utwórz darmowe konto na <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-medium">https://neon.tech</a> i stwórz nowy projekt (np. <code>flask-todo-next</code>, region <code>AWS Europe Frankfurt</code>).
                  </li>
                  <li>
                    Skopiuj swój <strong>Connection String</strong> (`postgresql://...`) i wklej go w zakładce <strong>1. Połączenie i Synchronizacja</strong>.
                  </li>
                  <li>
                    Kliknij <strong>„Zainicjuj tabele i wyślij lokalne dane do Neon”</strong> — aplikacja sama wykona zapytania `CREATE TABLE IF NOT EXISTS` oraz prześle 5 zadań startowych.
                  </li>
                  <li>
                    Alternatywnie możesz ręcznie wykonać poniższy skrypt DDL w narzędziu <strong>Neon SQL Editor</strong>:
                  </li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 rounded-t-xl bg-slate-800 text-slate-300 text-xs font-mono border-b border-slate-700">
                  <span>schema.sql (PostgreSQL 16 / Neon)</span>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Skopiowano!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Kopiuj skrypt SQL
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-b-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-64">
                  <code>{NEON_SCHEMA_SQL}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
