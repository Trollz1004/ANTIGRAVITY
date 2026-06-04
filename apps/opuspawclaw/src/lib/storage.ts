import { ipcMain, app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

export function setupStorageHandlers() {
  const dbPath = path.join(app.getPath('userData'), 'opuspawclaw.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      role TEXT,
      content TEXT,
      model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);

  ipcMain.handle('get-conversations', () => {
    return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
  });

  ipcMain.handle('create-conversation', (_, title, mode) => {
    const stmt = db.prepare('INSERT INTO conversations (title, mode) VALUES (?, ?)');
    const info = stmt.run(title, mode);
    return info.lastInsertRowid;
  });

  ipcMain.handle('get-messages', (_, conversationId) => {
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
  });

  ipcMain.handle('add-message', (_, conversationId, role, content, model) => {
    const stmt = db.prepare('INSERT INTO messages (conversation_id, role, content, model) VALUES (?, ?, ?, ?)');
    const info = stmt.run(conversationId, role, content, model);
    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
    return info.lastInsertRowid;
  });
}
