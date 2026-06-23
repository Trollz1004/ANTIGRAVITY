# ManusClaw - Paperclip Integration Guide

This guide explains how to use ManusClaw's Paperclip integration to create and assign tasks directly from the GUI.

## 🎯 Overview

ManusClaw integrates with Paperclip (https://github.com/paperclipai/paperclip) to enable seamless task creation and assignment. You can:

- **Create Issues** - Create new tasks/issues in your Paperclip company
- **List Issues** - View all issues with filtering by status, agent, or project
- **Assign Issues** - Assign tasks to agents directly from ManusClaw
- **Add Comments** - Add comments and updates to tasks
- **Track Status** - Monitor task lifecycle from creation to completion

## 🔧 Setup

### 1. Configure Paperclip Connection

1. Open ManusClaw and go to **Settings**
2. Find the **Paperclip** section
3. Enter your Paperclip configuration:
   - **API URL**: Your Paperclip instance URL (e.g., `http://localhost:3000`)
   - **API Key**: Your Paperclip API key or JWT membership record
   - **Company ID**: Your Paperclip company ID

4. Click **Save Configuration**

### 2. Verify Connection

Once configured, you should see:
- ✅ "Connected to Paperclip" message
- ✅ Ability to view existing issues
- ✅ Task assignment tab becomes active

## 📋 Creating Tasks

### From the Tasks Tab

1. Click the **Tasks** tab in the sidebar
2. Fill in the task details:
   - **Title** (required) - Brief description of the task
   - **Description** (required) - Detailed requirements and deliverables
   - **Priority** - low, medium, high, or critical
   - **Status** - backlog, todo, or in_progress
   - **Assignee** (optional) - Agent ID or name to assign to

3. Click **Create Task in Paperclip**
4. Task will appear in your Paperclip company immediately

### From Chat Context

You can also create tasks from chat conversations:

1. In a chat, describe the task you want to create
2. Use the command: `/create-task [title]`
3. ManusClaw will extract details from context and create the task

## 👥 Assigning Tasks

### Assign During Creation

When creating a task, optionally enter the **Assignee** field with:
- Agent ID (e.g., `agent-001`)
- Agent name (e.g., `claude-opus`)
- Agent URL key

### Assign Existing Tasks

1. Go to **Tasks** tab
2. Find the task in the "Recent Tasks" list
3. Click the task to open details
4. Click **Assign to Agent**
5. Select or enter agent ID

## 🔄 Task Lifecycle

Paperclip tasks follow this lifecycle:

```
backlog → todo → in_progress → in_review → done
              ↓
           blocked
              ↓
          cancelled
```

### Status Meanings

| Status | Meaning |
|--------|---------|
| **backlog** | Not yet scheduled |
| **todo** | Ready to start |
| **in_progress** | Currently being worked on |
| **in_review** | Awaiting review/approval |
| **done** | Completed successfully |
| **blocked** | Blocked by dependencies |
| **cancelled** | No longer needed |

## 💬 Adding Comments

To add updates or comments to a task:

1. Open the task details
2. Scroll to **Comments** section
3. Type your update in markdown
4. Click **Add Comment**

Comments support:
- **@mentions** - @AgentName to notify agents
- **Markdown** - Bold, italics, code blocks, lists
- **Links** - Reference other issues or resources

## 🎯 Priority Levels

Choose the right priority for your tasks:

| Priority | Use When | Urgency |
|----------|----------|---------|
| **Low** | Can wait, nice-to-have | ⭐ |
| **Medium** | Normal work, standard timeline | ⭐⭐ |
| **High** | Important, needs attention soon | ⭐⭐⭐ |
| **Critical** | Urgent, blocking other work | ⭐⭐⭐⭐ |

## 🔗 Linking Tasks

### Parent-Child Relationships

Create task hierarchies by setting **Parent ID** when creating a task:

```
Epic (Parent)
├── Feature 1 (Child)
├── Feature 2 (Child)
└── Feature 3 (Child)
```

### Projects & Goals

Organize tasks by:
- **Project** - Group related tasks
- **Goal** - Align with company objectives
- **Billing Code** - Track costs and allocation

## 📊 Filtering & Searching

In the Tasks tab, filter by:

- **Status** - Show only specific statuses
- **Assignee** - Tasks assigned to specific agent
- **Project** - Tasks in specific project
- **Priority** - High priority tasks only

## ⚙️ Advanced Features

### Documents

Each task can have multiple documents (plan, design, notes):

```
Task
├── plan.md - Implementation plan
├── design.md - Design document
└── notes.md - Meeting notes
```

### Interactions

Request confirmations from the board/user:

- **request_confirmation** - Ask for approval
- **suggest_tasks** - Propose sub-tasks
- **ask_user_questions** - Gather information

### Attachments

Upload files to tasks:

1. Open task details
2. Click **Add Attachment**
3. Select file from computer
4. File is stored with task

## 🚀 Best Practices

### Task Creation

✅ **DO:**
- Write clear, specific titles
- Include acceptance criteria in description
- Set realistic priority levels
- Assign to appropriate agents
- Break large tasks into smaller sub-tasks

❌ **DON'T:**
- Create vague tasks without details
- Assign everything as "critical"
- Forget to set status
- Leave tasks unassigned indefinitely

### Task Management

✅ **DO:**
- Update status as work progresses
- Add comments for important updates
- Link related tasks
- Review completed tasks
- Archive old tasks

❌ **DON'T:**
- Leave tasks in "in_progress" forever
- Ignore blocked tasks
- Create duplicate tasks
- Assign tasks without notification

## 🐛 Troubleshooting

### "Paperclip not configured"

**Solution:** Go to Settings → Paperclip and enter your connection details.

### "Failed to create task"

**Possible causes:**
- Paperclip instance is offline
- API key is invalid or expired
- Company ID is incorrect
- Network connectivity issue

**Solution:** Verify Paperclip is running and credentials are correct.

### "Cannot assign to agent"

**Possible causes:**
- Agent ID doesn't exist
- Agent is inactive
- Insufficient permissions

**Solution:** Verify agent ID and check agent status in Paperclip.

### Tasks not appearing

**Solution:**
- Refresh the page
- Check filters aren't hiding tasks
- Verify Paperclip connection status

## 📚 Resources

- **Paperclip GitHub**: https://github.com/paperclipai/paperclip
- **Paperclip Docs**: https://paperclip.ing/docs
- **Hermes Adapter**: https://github.com/NousResearch/hermes-paperclip-adapter
- **ManusClaw Docs**: See README_MANUSCLAW.md

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Paperclip documentation
3. Open an issue on GitHub
4. Contact support@manus.im

---

**Happy task management! 🚀**
