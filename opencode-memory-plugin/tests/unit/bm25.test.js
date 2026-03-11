/**
 * Unit tests for BM25 search module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BM25Index, createBM25Index, bm25Search } from '../../lib/bm25.js';

describe('BM25Index', () => {
  let index;

  beforeEach(() => {
    index = new BM25Index();
  });

  describe('addDocument', () => {
    it('should add a document to the index', () => {
      index.addDocument('doc1', 'Hello world this is a test');
      expect(index.docCount).toBe(1);
    });

    it('should calculate term frequencies', () => {
      index.addDocument('doc1', 'test test test');
      const doc = index.documents.get('doc1');
      expect(doc.termFreq.get('test')).toBe(3);
    });

    it('should update average document length', () => {
      index.addDocument('doc1', 'hello world');
      index.addDocument('doc2', 'foo bar baz qux');
      expect(index.avgDocLength).toBe(3); // (2 + 4) / 2
    });
  });

  describe('removeDocument', () => {
    it('should remove a document from the index', () => {
      index.addDocument('doc1', 'Hello world');
      index.removeDocument('doc1');
      expect(index.docCount).toBe(0);
      expect(index.documents.has('doc1')).toBe(false);
    });

    it('should update term document frequencies', () => {
      index.addDocument('doc1', 'hello world');
      index.addDocument('doc2', 'hello foo');
      index.removeDocument('doc1');

      expect(index.termDocFreq.get('hello')).toBe(1);
      expect(index.termDocFreq.get('world')).toBeUndefined();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      index.addDocument('doc1', 'The quick brown fox jumps over the lazy dog');
      index.addDocument('doc2', 'A fast brown dog runs in the park');
      index.addDocument('doc3', 'Programming in JavaScript is fun');
    });

    it('should return matching documents', () => {
      const results = index.search('brown dog');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should rank documents by relevance', () => {
      const results = index.search('brown');
      expect(results.length).toBe(2);
      // Both doc1 and doc2 contain 'brown'
      const ids = results.map(r => r.id);
      expect(ids).toContain('doc1');
      expect(ids).toContain('doc2');
    });

    it('should return empty array for no matches', () => {
      const results = index.search('xyznonexistent');
      expect(results).toEqual([]);
    });

    it('should respect limit parameter', () => {
      const results = index.search('brown', { limit: 1 });
      expect(results.length).toBe(1);
    });

    it('should respect minScore parameter', () => {
      const results = index.search('the', { minScore: 0.5 });
      results.forEach(r => {
        expect(r.score).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('getStats', () => {
    it('should return index statistics', () => {
      index.addDocument('doc1', 'hello world');
      const stats = index.getStats();

      expect(stats.documentCount).toBe(1);
      expect(stats.averageDocumentLength).toBe(2);
      expect(stats.uniqueTerms).toBe(2);
      expect(stats.totalTokens).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear the entire index', () => {
      index.addDocument('doc1', 'hello world');
      index.clear();

      expect(index.docCount).toBe(0);
      expect(index.documents.size).toBe(0);
      expect(index.avgDocLength).toBe(0);
    });
  });
});

describe('createBM25Index', () => {
  it('should create an index from documents array', () => {
    const documents = [
      { id: 'doc1', content: 'Hello world' },
      { id: 'doc2', content: 'Foo bar' }
    ];

    const index = createBM25Index(documents);
    expect(index.docCount).toBe(2);
  });

  it('should preserve metadata', () => {
    const documents = [
      { id: 'doc1', content: 'Hello world', metadata: { source: 'test.txt' } }
    ];

    const index = createBM25Index(documents);
    const doc = index.documents.get('doc1');
    expect(doc.metadata.source).toBe('test.txt');
  });
});

describe('bm25Search', () => {
  it('should perform quick search on documents', () => {
    const documents = [
      { id: 'doc1', content: 'The quick brown fox' },
      { id: 'doc2', content: 'JavaScript programming' }
    ];

    const results = bm25Search('fox', documents);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('doc1');
  });
});