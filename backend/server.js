
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { authRouter, authenticate } = require("./auth");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

const validStatuses = ["To do", "In progress", "Done"];
const validPriorities = ["High", "Medium", "Low"];

const projectAccents = {
  "Website redesign": "purple",
  "DevFlow App": "green",
  "Mobile application": "orange",
};

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);

// Basic API check
app.get("/", (req, res) => {
  res.send("Welcome to the DevFlow API!");
});

// Database health check
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS server_time, current_database() AS database_name"
    );

    res.json({
      status: "ok",
      message: "DevFlow is connected to PostgreSQL!",
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    res.status(500).json({
      error: "Database connection failed",
    });
  }
});
// All task routes require an authenticated user.
app.use("/api/tasks", authenticate);
// GET: Fetch all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, title, project, status, priority, due,
        assignees, comments, files, accent
        FROM tasks
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
      `, [req.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tasks failed:", error.message);

    res.status(500).json({
      error: "Could not fetch tasks",
    });
  }
});

// POST: Create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      project,
      status = "To do",
      priority = "Medium",
      due = "No date",
    } = req.body;

    if (
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.trim().length > 120
    ) {
      return res.status(400).json({
        error: "Task title must contain 1 to 120 characters",
      });
    }

    if (
      typeof project !== "string" ||
      project.trim().length === 0
    ) {
      return res.status(400).json({
        error: "A project name is required",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid task status",
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Invalid task priority",
      });
    }

    if (typeof due !== "string") {
      return res.status(400).json({
        error: "Due date must be text",
      });
    }

    const accent = projectAccents[project.trim()] || "purple";

    
const projectResult = await pool.query(
  `SELECT id, accent
   FROM projects
   WHERE user_id = $1 AND name = $2`,
  [req.userId, project.trim()]
);

if (projectResult.rows.length === 0) {
  return res.status(400).json({
    error: "Please select a valid project."
  });
}

const selectedProject = projectResult.rows[0];

const result = await pool.query(
  `INSERT INTO tasks
    (user_id, project_id, title, project, status, priority, due,
     assignees, comments, files, accent)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
   RETURNING
     id, title, project, status, priority, due,
     assignees, comments, files, accent`,
  [
    req.userId,
    selectedProject.id,
    title.trim(),
    project.trim(),
    status,
    priority,
    due,
    ["AS"],
    0,
    0,
    selectedProject.accent,
  ]
);


    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task failed:", error.message);

    res.status(500).json({
      error: "Could not create task",
    });
  }
});

// PATCH: Update a task's status

// PATCH: Update task details or only its status.
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, project, status, priority, due } = req.body;

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const updates = [];
    const values = [];

    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        title.trim().length < 1 ||
        title.trim().length > 120
      ) {
        return res.status(400).json({ error: "Invalid task title" });
      }
      addUpdate("title", title.trim());
    }

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      addUpdate("status", status);
    }

    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }
      addUpdate("priority", priority);
    }

    if (due !== undefined) {
      if (typeof due !== "string" || due.length > 80) {
        return res.status(400).json({ error: "Invalid due date" });
      }
      addUpdate("due", due.trim() || "No date");
    }

    if (project !== undefined) {
      if (
        typeof project !== "string" ||
        !project.trim() ||
        project.trim().length > 100
      ) {
        return res.status(400).json({ error: "Invalid project" });
      }

      const projectName = project.trim();

      if (projectName === "Unassigned") {
        addUpdate("project_id", null);
        addUpdate("project", "Unassigned");
        addUpdate("accent", "purple");
      } else {
        const projectResult = await pool.query(
          `SELECT id, name, accent
           FROM projects
           WHERE user_id = $1 AND name = $2`,
          [req.userId, projectName]
        );

        if (!projectResult.rows.length) {
          return res.status(400).json({
            error: "Please select a valid project"
          });
        }

        const selectedProject = projectResult.rows[0];

        addUpdate("project_id", selectedProject.id);
        addUpdate("project", selectedProject.name);
        addUpdate("accent", selectedProject.accent);
      }
    }

    if (!updates.length) {
      return res.status(400).json({
        error: "No task details provided"
      });
    }

    values.push(id);
    const idPlaceholder = `$${values.length}`;

    values.push(req.userId);
    const userPlaceholder = `$${values.length}`;

    const result = await pool.query(
      `UPDATE tasks
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = ${idPlaceholder}
         AND user_id = ${userPlaceholder}
       RETURNING id, title, project, status, priority, due,
                 assignees, comments, files, accent`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Update task failed:", error.message);
    res.status(500).json({ error: "Could not update task" });
  }
});


// DELETE: Remove a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid task ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Delete task failed:", error.message);

    res.status(500).json({
      error: "Could not delete task",
    });
  }
});

// ==========================================
// PROJECT MANAGEMENT APIs
// ==========================================

// All project routes require login.
app.use("/api/projects", authenticate);

// GET: Fetch projects belonging to logged-in user
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.accent,
         COUNT(t.id)::int AS total_tasks,
         COUNT(t.id) FILTER (
           WHERE t.status = 'Done'
         )::int AS completed_tasks
       FROM projects p
       LEFT JOIN tasks t
         ON t.project_id = p.id
         AND t.user_id = p.user_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch projects failed:", error.message);
    res.status(500).json({ error: "Could not fetch projects." });
  }
});

// POST: Create a new project
app.post("/api/projects", async (req, res) => {
  try {
    const { name, description = "", accent = "purple" } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        error: "Project name must contain 2 to 100 characters."
      });
    }

    if (
      typeof description !== "string" ||
      description.length > 250
    ) {
      return res.status(400).json({
        error: "Description cannot exceed 250 characters."
      });
    }

    if (!["purple", "green", "orange"].includes(accent)) {
      return res.status(400).json({
        error: "Invalid project colour."
      });
    }

    const result = await pool.query(
      `INSERT INTO projects
       (user_id, name, description, accent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, accent`,
      [req.userId, name.trim(), description.trim(), accent]
    );

    res.status(201).json({
      message: "Project created successfully.",
      project: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "A project with this name already exists."
      });
    }

    console.error("Create project failed:", error.message);
    res.status(500).json({ error: "Could not create project." });
  }
});

// PATCH: Edit an existing project
app.patch("/api/projects/:id", async (req, res) => {
  let client;

  try {
    const id = Number(req.params.id);
    const { name, description = "", accent = "purple" } = req.body;

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100
    ) {
      return res.status(400).json({ error: "Invalid project name." });
    }

    if (
      typeof description !== "string" ||
      description.length > 250 ||
      !["purple", "green", "orange"].includes(accent)
    ) {
      return res.status(400).json({ error: "Invalid project details." });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           accent = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, description, accent`,
      [name.trim(), description.trim(), accent, id, req.userId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Project not found." });
    }

    // Keep existing task display information in sync.
    await client.query(
      `UPDATE tasks
       SET project = $1, accent = $2, updated_at = NOW()
       WHERE project_id = $3 AND user_id = $4`,
      [name.trim(), accent, id, req.userId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Project updated successfully.",
      project: result.rows[0]
    });

  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: "A project with this name already exists."
      });
    }

    console.error("Update project failed:", error.message);
    res.status(500).json({ error: "Could not update project." });

  } finally {
    if (client) client.release();
  }
});

// DELETE: Delete a project

app.delete("/api/projects/:id", async (req, res) => {
  let client;

  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid project ID."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const projectResult = await client.query(
      `SELECT id
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (projectResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Project not found."
      });
    }

    // Preserve the tasks instead of deleting them.
    await client.query(
      `UPDATE tasks
       SET project_id = NULL,
           project = 'Unassigned',
           accent = 'purple',
           updated_at = NOW()
       WHERE project_id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    await client.query(
      `DELETE FROM projects
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Project deleted successfully.",
      tasksPreserved: true
    });

  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Delete project failed:", error.message);

    res.status(500).json({
      error: "Could not delete project."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});


app.listen(PORT, () => {
  console.log(`DevFlow backend running at http://localhost:${PORT}`);
});
