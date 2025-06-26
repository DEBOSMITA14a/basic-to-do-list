const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// Initialize SQLite database
const db = new sqlite3.Database('tasks.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        // Create tasks table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0
        )`);
    }
});

// API Endpoints
// Get all tasks
app.get('/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add a new task
app.post('/tasks', (req, res) => {
    const { text } = req.body;
    if (!text) {
        res.status(400).json({ error: 'Task text is required' });
        return;
    }
    db.run('INSERT INTO tasks (text, completed) VALUES (?, 0)', [text], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, text, completed: false });
    });
});

// Toggle task completion
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT completed FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        const completed = !row.completed;
        db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed, id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, text: row.text, completed });
        });
    });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Task deleted' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});