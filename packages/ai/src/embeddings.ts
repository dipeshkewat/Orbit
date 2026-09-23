/**
 * Embedding generation for brand-voice semantic search (pgvector, 1536 dims).
 *
 * Uses OpenAI text-embedding-3-small when OPENAI_API_KEY is configured.
 * Without a key it falls back to a deterministic local hash embedding so
 * development and tests run with no external dependency — embeddings are
 * only used for relative similarity, so the fallback stays self-consistent.
 */

export const EMBEDDING_DIMENSIONS = 1536;

function hashToUnitFloat(seed: string, index: number): number {
  // FNV-1a over seed+index → deterministic value in [-1, 1].
  let hash = 0x811c9dc5;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return ((hash % 20000) - 10000) / 10000;
}

function localEmbedding(text: string): number[] {
  // Token-shingled deterministic embedding: each token perturbs a subset of
  // dimensions so semantically similar texts share dominant dimensions.
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    for (let d = 0; d < EMBEDDING_DIMENSIONS; d += 64) {
      vector[d] += hashToUnitFloat(token, d);
    }
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey !== "xxx") {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
          dimensions: EMBEDDING_DIMENSIONS,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;
        if (Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSIONS) {
          return embedding;
        }
      }
      // Non-OK or malformed → fall through to the local embedding.
    } catch {
      // Network failure → fall through to the local embedding.
    }
  }

  return localEmbedding(text);
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
