import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get question bank
  app.get('/api/questions', (req, res) => {
    try {
      const questionBankPath = path.join(__dirname, '../client/data/questionBank.json');
      const questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf-8'));
      res.json(questionBank);
    } catch (error) {
      console.error('Error reading question bank:', error);
      res.status(500).json({ message: 'Failed to load question bank' });
    }
  });

  // API route to save wrong answers (for potential future server-side storage)
  app.post('/api/wrong-answers', (req, res) => {
    try {
      // In the current implementation, we're using client-side storage
      // This endpoint is added for potential future server-side storage
      res.status(200).json({ message: 'Wrong answer saved' });
    } catch (error) {
      console.error('Error saving wrong answer:', error);
      res.status(500).json({ message: 'Failed to save wrong answer' });
    }
  });

  // API route to save test results (for potential future server-side storage)
  app.post('/api/test-results', (req, res) => {
    try {
      // In the current implementation, we're using client-side storage
      // This endpoint is added for potential future server-side storage
      res.status(200).json({ message: 'Test result saved' });
    } catch (error) {
      console.error('Error saving test result:', error);
      res.status(500).json({ message: 'Failed to save test result' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
