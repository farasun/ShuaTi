
import Dexie, { Table } from 'dexie';
import type { WrongAnswer, TestResult } from '@shared/types';

export class ExamDatabase extends Dexie {
  wrongAnswers!: Table<WrongAnswer, string>; // string是qid作为主键
  testResults!: Table<TestResult, string>; // string是id作为主键

  constructor() {
    super('ExamDatabase');
    this.version(1).stores({
      wrongAnswers: 'qid, timestamp, wrongCount',
      testResults: 'id, timestamp'
    });
  }
}

export const db = new ExamDatabase();
