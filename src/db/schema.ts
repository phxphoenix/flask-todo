import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export type ItemType = 'TASK' | 'NOTE';
export type ItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
export type ItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// 1. categories (Kategorie / Przestrzenie)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 30 }).notNull(),
  icon: varchar('icon', { length: 20 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. items (Zunifikowana tabela na Zadania i Notatki – bez limitu 200 znaków)
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 10 }).$type<ItemType>().notNull().default('TASK'),
  title: varchar('title', { length: 255 }).notNull(),
  content_markdown: text('content_markdown').notNull().default(''),
  status: varchar('status', { length: 20 }).$type<ItemStatus>().notNull().default('TODO'),
  priority: varchar('priority', { length: 10 }).$type<ItemPriority>().notNull().default('MEDIUM'),
  is_pinned: boolean('is_pinned').notNull().default(false),
  due_date: timestamp('due_date', { withTimezone: true }),
  category_id: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. subtasks (Podzadania / Checklista wewnątrz zadania lub notatki)
export const subtasks = pgTable('subtasks', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  done: boolean('done').notNull().default(false),
  position: integer('position').notNull().default(0),
});

// 4. tags oraz item_tags (Relacja wiele-do-wielu)
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull().unique(),
  color: varchar('color', { length: 30 }).notNull().default('indigo'),
});

export const item_tags = pgTable(
  'item_tags',
  {
    item_id: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    tag_id: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.item_id, t.tag_id] }),
  })
);

// Relacje Drizzle ORM
export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.category_id],
    references: [categories.id],
  }),
  subtasks: many(subtasks),
  itemTags: many(item_tags),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  item: one(items, {
    fields: [subtasks.item_id],
    references: [items.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemTags: many(item_tags),
}));

export const itemTagsRelations = relations(item_tags, ({ one }) => ({
  item: one(items, {
    fields: [item_tags.item_id],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [item_tags.tag_id],
    references: [tags.id],
  }),
}));

// Typy domenowe dla aplikacji
export interface CategoryDTO {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface TagDTO {
  id: number;
  name: string;
  color: string;
}

export interface SubtaskDTO {
  id: number;
  item_id: number;
  title: string;
  done: boolean;
  position: number;
}

export interface ItemDTO {
  id: number;
  type: ItemType;
  title: string;
  content_markdown: string;
  status: ItemStatus;
  priority: ItemPriority;
  is_pinned: boolean;
  due_date: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  subtasks: SubtaskDTO[];
  tag_ids: number[];
}

export interface WorkspaceData {
  categories: CategoryDTO[];
  tags: TagDTO[];
  items: ItemDTO[];
}

export const NEON_SCHEMA_SQL = `-- Pełny schemat relacyjny PostgreSQL dla Neon Serverless
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL,
  icon VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS subtasks (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  color VARCHAR(30) NOT NULL DEFAULT 'indigo'
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);`;
