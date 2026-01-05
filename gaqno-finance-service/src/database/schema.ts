import { pgTable, uuid, varchar, timestamp, text, numeric, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const transactionStatusEnum = pgEnum('transaction_status', ['pago', 'a_pagar', 'em_atraso']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const recurrenceTypeEnum = pgEnum('recurrence_type', ['none', 'fifth_business_day', 'day_15', 'last_day', 'custom']);

export const financeCategories = pgTable('finance_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  color: varchar('color', { length: 50 }),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const financeSubcategories = pgTable('finance_subcategories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  parentCategoryId: uuid('parent_category_id').notNull().references(() => financeCategories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const financeCreditCards = pgTable('finance_credit_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  lastFourDigits: varchar('last_four_digits', { length: 4 }).notNull(),
  cardType: varchar('card_type', { length: 50 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }),
  creditLimit: numeric('credit_limit', { precision: 10, scale: 2 }).notNull(),
  closingDay: integer('closing_day').notNull(),
  dueDay: integer('due_day').notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const financeTransactions = pgTable('finance_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  categoryId: uuid('category_id').references(() => financeCategories.id, { onDelete: 'set null' }),
  subcategoryId: uuid('subcategory_id').references(() => financeSubcategories.id, { onDelete: 'set null' }),
  creditCardId: uuid('credit_card_id').references(() => financeCreditCards.id, { onDelete: 'set null' }),
  description: varchar('description', { length: 500 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  dueDate: timestamp('due_date'),
  status: transactionStatusEnum('status').notNull().default('a_pagar'),
  assignedTo: uuid('assigned_to'),
  notes: text('notes'),
  installmentCount: integer('installment_count').notNull().default(1),
  installmentCurrent: integer('installment_current').notNull().default(1),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringType: recurrenceTypeEnum('recurring_type'),
  recurringDay: integer('recurring_day'),
  recurringMonths: integer('recurring_months'),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const categoriesRelations = relations(financeCategories, ({ many }) => ({
  subcategories: many(financeSubcategories),
  transactions: many(financeTransactions)
}));

export const subcategoriesRelations = relations(financeSubcategories, ({ one, many }) => ({
  parentCategory: one(financeCategories, {
    fields: [financeSubcategories.parentCategoryId],
    references: [financeCategories.id]
  }),
  transactions: many(financeTransactions)
}));

export const creditCardsRelations = relations(financeCreditCards, ({ many }) => ({
  transactions: many(financeTransactions)
}));

export const transactionsRelations = relations(financeTransactions, ({ one }) => ({
  category: one(financeCategories, {
    fields: [financeTransactions.categoryId],
    references: [financeCategories.id]
  }),
  subcategory: one(financeSubcategories, {
    fields: [financeTransactions.subcategoryId],
    references: [financeSubcategories.id]
  }),
  creditCard: one(financeCreditCards, {
    fields: [financeTransactions.creditCardId],
    references: [financeCreditCards.id]
  })
}));

