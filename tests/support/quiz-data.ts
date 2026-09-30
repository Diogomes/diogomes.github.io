import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './pages';

export type Question = { q: [string, string]; o: [string, string][]; a: number; e: [string, string]; l: string };
export type Level = 'junior' | 'pleno' | 'senior';
export type QuizBank = Record<string, Record<Level, Question[]>>;

/**
 * Lê o banco de perguntas direto do assets/js/quiz.js (objeto literal `var Q = {...};`),
 * para o teste usar as mesmas respostas que o site — sem duplicar o gabarito aqui.
 */
export function loadQuizBank(): QuizBank {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/quiz.js'), 'utf8');
  const start = src.indexOf('var Q = {');
  const end = src.indexOf('\n  };', start);
  if (start < 0 || end < 0) throw new Error('Não encontrei "var Q = {...};" em quiz.js');
  const literal = src.slice(start + 'var Q = '.length, end + '\n  }'.length);
  // Só literais (strings/números/arrays/objetos): seguro avaliar isolado.
  return new Function(`"use strict"; return (${literal});`)() as QuizBank;
}

/** Texto sem tags HTML (as perguntas podem ter <code>, <em>…). */
export const plain = (html: string): string =>
  html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
