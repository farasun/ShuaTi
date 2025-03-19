import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Question schema represents the structure of questions in the test bank
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  qid: text("qid").notNull().unique(), // Unique identifier like "1-4-001"
  text: text("text").notNull(), // Question text
  options: text("options").array().notNull(), // Answer options
  correctIndex: integer("correct_index").notNull(), // Index of correct answer
  chapter: text("chapter").notNull(), // Chapter reference
  difficulty: text("difficulty").notNull(), // Difficulty level (L1-L3)
});

// Wrong answer records
export const wrongAnswers = pgTable("wrong_answers", {
  id: serial("id").primaryKey(),
  qid: text("qid").notNull(), // Reference to question
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userOptionIndex: integer("user_option_index").notNull(), // User's wrong answer
});

// Test results
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  score: integer("score").notNull(), // Number of correct answers
  total: integer("total").notNull(), // Total questions in test
  answers: jsonb("answers").notNull(), // Record of all answers in the test
});

// Schema for inserting a new wrong answer
export const insertWrongAnswerSchema = createInsertSchema(wrongAnswers).pick({
  qid: true,
  userOptionIndex: true,
});

// Schema for inserting a new test result
export const insertTestResultSchema = createInsertSchema(testResults).pick({
  score: true,
  total: true,
  answers: true,
});

export type InsertWrongAnswer = z.infer<typeof insertWrongAnswerSchema>;
export type WrongAnswer = typeof wrongAnswers.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

export type Question = typeof questions.$inferSelect;
