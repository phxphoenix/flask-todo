# 🚀 Task & Note Hub 2.0 (Next.js + TypeScript + Neon Serverless PostgreSQL)

Całkowicie przebudowana, nowoczesna aplikacja Full-Stack / SPA do zarządzania **Zadaniami (Tasks)**, **Podzadaniami (Checklists)** oraz **Notatkami (Markdown)**, zastępująca dawną aplikację Flask/SQLite (`_legacy_flask/`).

---

## ✨ Co zostało naprawione i ulepszone względem starej wersji Flask?

1. **Koniec limitu `VARCHAR(200)`**: Zunifikowana tabela `items` obsługuje zarówno zadania (`TASK`), jak i rozbudowane notatki techniczne (`NOTE`) o nieograniczonej długości w formacie **Markdown** (`TEXT`).
2. **Pełny model relacyjny (Drizzle ORM + PostgreSQL)**:
   - `categories` — przestrzenie robocze z kolorami i ikonami,
   - `items` — zadania i notatki z priorytetami (`LOW`, `MEDIUM`, `HIGH`), statusami (`TODO`, `IN_PROGRESS`, `DONE`, `ARCHIVED`), przypięciem (`is_pinned`) i terminem wykonania (`due_date`),
   - `subtasks` — listy kroków wewnątrz każdego zadania lub notatki z paskiem postępu,
   - `tags` + `item_tags` — relacja wiele-do-wielu dla kolorowych tagów.
3. **Wzorzec Dual-Mode Storage Adapter (GitHub Pages + Neon Cloud)**:
   - **Tryb Lokalny (Offline-First Fallback)**: Domyślnie aplikacja działa natychmiast po uruchomieniu na statycznym hostingu **GitHub Pages**, przechowując dane w `localStorage` zainicjowanym 5 oryginalnymi zadaniami ze starej bazy `instance/tasks.db`.
   - **Tryb Chmurowy (Neon PostgreSQL Direct HTTP)**: Po kliknięciu przycisku **„🔌 Baza danych Neon”** w interfejsie możesz wkleić swój connection string `postgresql://...neon.tech/...`. Klucz jest zapisywany wyłącznie w Twojej przeglądarce, a aplikacja łączy się bezpośrednio przez HTTPS za pomocą sterownika `@neondatabase/serverless`.
4. **Bezpieczny Eksport i Import JSON z walidacją `Zod`**:
   - Eksport generuje plik `notes_tasks_backup_YYYY-MM-DD.json` bezpośrednio w pamięci przeglądarki (`Blob` + `URL.createObjectURL`) bez zapisywania plików tymczasowych na dysku serwera.
   - Import posiada walidację `Zod`, zachowuje **pełną wsteczną kompatybilność** ze starym plikiem `tasks_backup.json` z Flaska oraz nie psuje sekwencji `SERIAL` w PostgreSQL (`setval(pg_get_serial_sequence(...))`).

---

## 🛠️ Stack Technologiczny

- **Framework**: Next.js 15 (App Router, `output: 'export'`) + TypeScript
- **Stylizacja i UI**: Tailwind CSS + Lucide React + Dark Mode / Light Mode
- **Baza danych i ORM**: `@neondatabase/serverless` + `drizzle-orm`
- **Walidacja danych**: `zod`

---

## 📦 Uruchomienie lokalne

1. Zainstaluj zależności:
   ```bash
   npm install
   ```
2. (Opcjonalnie) Skopiuj `.env.example` do `.env.local` i uzupełnij `NEXT_PUBLIC_DATABASE_URL`:
   ```bash
   cp .env.example .env.local
   ```
3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```
4. Zbuduj statyczną paczkę produkcyjną (`out/`):
   ```bash
   npm run build
   ```

---

## 🔌 Konfiguracja bazy danych Neon Serverless PostgreSQL

1. Załóż darmowe konto na [https://neon.tech](https://neon.tech) i utwórz nowy projekt PostgreSQL.
2. Skopiuj swój **Connection String** (`postgresql://neondb_owner:...`).
3. W uruchomionej aplikacji kliknij przycisk **„🔌 Baza danych Neon”** (w lewym dolnym rogu paska bocznego lub w nagłówku).
4. Wklej Connection String i kliknij **„Zainicjuj tabele i wyślij lokalne dane do Neon”** — aplikacja automatycznie wykona `CREATE TABLE IF NOT EXISTS` dla wszystkich 5 tabel i zsynchronizuje dane startowe.

---

## 🌐 Wdrożenie na GitHub Pages oraz Vercel

- **GitHub Pages**: W repozytorium znajduje się gotowy workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). W ustawieniach repozytorium GitHub przejdź do **Settings → Pages → Build and deployment** i wybierz **Source: GitHub Actions**. Każdy push na gałąź `main` automatycznie zbuduje i opublikuje aplikację.
- **Vercel**: Zaimportuj repozytorium w panelu Vercel i opcjonalnie dodaj zmienną środowiskową `NEXT_PUBLIC_DATABASE_URL`.
