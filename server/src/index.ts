import express, { Request, Response } from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// Data file path
const dataDir = path.join(process.cwd(), 'data');
const divisionsFile = path.join(dataDir, 'capital-divisions.json');

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(divisionsFile);
  } catch {
    const seed = {
      divisions: [
        { id: '1', name: 'Gastos Essenciais', percentage: 50, color: '#10B981' },
        { id: '2', name: 'Poupança', percentage: 20, color: '#3B82F6' },
        { id: '3', name: 'Investimentos', percentage: 20, color: '#4f3196ff' },
        { id: '4', name: 'Lazer', percentage: 10, color: '#F59E0B' }
      ]
    };
    await fs.writeFile(divisionsFile, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

async function readDivisions() {
  await ensureDataFile();
  const raw = await fs.readFile(divisionsFile, 'utf-8');
  const data = JSON.parse(raw);
  return data.divisions ?? [];
}

async function writeDivisions(divisions: any[]) {
  await ensureDataFile();
  await fs.writeFile(divisionsFile, JSON.stringify({ divisions }, null, 2), 'utf-8');
}

app.get('/api/capital-divisions', async (_req: Request, res: Response) => {
  try {
    const divisions = await readDivisions();
    res.json({ divisions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read divisions' });
  }
});

app.post('/api/capital-divisions', async (req: Request, res: Response) => {
  try {
    const divisions = req.body?.divisions;
    if (!Array.isArray(divisions)) {
      return res.status(400).json({ error: 'divisions must be an array' });
    }
    // sanitize
    const clean = divisions.map((d: any) => ({
      id: String(d.id ?? Date.now().toString()),
      name: String(d.name ?? ''),
      percentage: Number(d.percentage ?? 0),
      color: String(d.color ?? '#10B981')
    }));
    await writeDivisions(clean);
    res.json({ divisions: clean });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write divisions' });
  }
});

app.listen(PORT, () => {
  console.log(`Capital Divisions API running on http://localhost:${PORT}`);
});
