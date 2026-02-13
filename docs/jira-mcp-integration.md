# Jira Specialist Agent - MCP Integration

## Overview

The `jira-specialist` agent now uses the **Atlassian MCP server** for all Jira interactions. This provides real-time, automated access to Jira tickets, eliminating manual lookups and reducing errors.

## What Changed

### Before (Manual)
```
❌ User had to provide ticket type
❌ User had to confirm hierarchy
❌ Manual status updates prone to errors
❌ No validation of ticket relationships
❌ Back-and-forth for ticket details
```

### After (MCP-Powered)
```
✅ Auto-fetch ticket details from Jira
✅ Auto-validate hierarchy relationships
✅ Automated status transitions
✅ Real-time ticket validation
✅ One-step ticket updates
```

## Updated Workflow Steps

### Step 1: Identify and Fetch Jira Ticket
**Old:** Search for ticket key, ask user for details
**New:**
- Find ticket key in conversation/code
- **Use MCP** to fetch full ticket details from Jira
- Extract: type, summary, status, assignee, parent links

### Step 2: Determine Ticket Type
**Old:** Ask user or guess from naming
**New:**
- **Use MCP** to get exact ticket type from Jira
- Supports: Epic, Story, Subtask, Bug, Task

### Step 3: Validate Hierarchy
**Old:** Ask user to confirm parent tickets
**New:**
- **Use MCP** to fetch complete hierarchy from Jira
- Validate Epic → Story → Subtask chain
- Verify all parent tickets exist and are accessible

### Step 11: Update Jira
**Old:** Manual API calls or ask user to update
**New:**
- **Use MCP** to fetch available status transitions
- **Use MCP** to transition ticket status
- **Use MCP** to add PR link as comment
- **Use MCP** to update assignee if needed

## MCP Tools Used

The agent uses these MCP capabilities:

| MCP Tool | Purpose | Example |
|----------|---------|---------|
| **Fetch ticket** | Get full ticket details | Type, status, summary, assignee |
| **Get issue links** | Fetch parent/child relationships | Epic → Story → Subtask |
| **Get transitions** | List available status changes | To Do → In Progress → In Review |
| **Update status** | Transition ticket to new status | Move to "In Review" |
| **Add comment** | Post PR links and updates | "PR #42 opened: https://..." |
| **Search (JQL)** | Find related tickets | Find all subtasks for a story |

## Example Workflow

### User Request
```
User: "Commit this work for GAQNO-456"
```

### Agent Execution
```
Step 1: Identify ticket key
  → Found: GAQNO-456
  → MCP: Fetching ticket from Jira...
  → ✅ Ticket found
     - Type: Subtask
     - Summary: "Add login form validation"
     - Status: "In Progress"
     - Assignee: gabriel.aquino@outlook.com

Step 2: Determine ticket type
  → MCP: Type = Subtask (confirmed)

Step 3: Validate hierarchy
  → MCP: Fetching parent tickets...
  → Parent: GAQNO-450 (Story) - "User Authentication"
  → Grandparent: GAQNO-400 (Epic) - "Security Improvements"
  → ✅ Hierarchy valid

Step 4: Determine branch
  → Branch: feature/GAQNO-456-login-validation
  → Base: feature/GAQNO-450-user-auth

Step 5-10: [Git workflow continues...]

Step 11: Update Jira
  → MCP: Fetching available transitions...
  → Available: [In Progress → In Review, In Progress → Done]
  → User confirmation: Move to "In Review"?
  → MCP: Transitioning GAQNO-456 → In Review
  → MCP: Adding comment with PR link
  → ✅ Jira updated
```

## Error Handling

### MCP Connection Issues
```
Error: MCP server not responding
Action:
  1. Check MCP status: `claude mcp list`
  2. Verify atlassian server is connected
  3. If disconnected, restart: `claude mcp add ...`
```

### Ticket Not Found
```
Error: GAQNO-456 not found via MCP
Action:
  1. Verify ticket key format (PROJECT-NUMBER)
  2. Check Jira project access
  3. Confirm API token has read permissions
```

### Invalid Transition
```
Error: Cannot transition to "In Review"
Action:
  1. MCP: Fetch available transitions
  2. Show user valid options
  3. Ask user to select from available states
```

## Benefits

### 🚀 Speed
- No manual lookups
- Instant ticket validation
- Automated status updates

### ✅ Accuracy
- Real-time Jira data
- No manual errors
- Verified hierarchies

### 🔄 Automation
- Auto-fetch ticket details
- Auto-validate relationships
- Auto-update statuses

### 📊 Visibility
- Always show current ticket state
- Display hierarchy clearly
- Report all changes made

## Configuration

The MCP server is configured globally for this project:

```bash
# Check MCP status
claude mcp list

# Expected output:
atlassian: uvx mcp-atlassian - ✓ Connected
```

## Credentials

The agent uses credentials from MCP configuration:
- **Jira URL**: https://gaqno.atlassian.net
- **Jira Username**: gabriel.aquino@outlook.com
- **Jira API Token**: Configured in MCP (secure)

## Testing

To verify MCP integration:

```bash
# Test 1: Fetch a ticket
User: "What's the status of GAQNO-100?"
Expected: Agent uses MCP to fetch and display ticket details

# Test 2: Validate hierarchy
User: "Commit this for GAQNO-456"
Expected: Agent uses MCP to validate subtask → story → epic chain

# Test 3: Update status
User: "Move GAQNO-456 to In Review"
Expected: Agent uses MCP to transition and confirms success
```

## Troubleshooting

### MCP Not Connected
```bash
# Re-add Atlassian MCP
claude mcp add atlassian \
  -e JIRA_URL="https://gaqno.atlassian.net" \
  -e JIRA_USERNAME="gabriel.aquino@outlook.com" \
  -e JIRA_API_TOKEN="your-token" \
  -- uvx mcp-atlassian
```

### Permission Denied
- Verify API token has correct scopes in Jira
- Required scopes: read:jira-work, write:jira-work

### Slow Responses
- MCP fetches from Jira API (network latency)
- Consider caching frequently accessed tickets in agent memory

---

**Updated**: 2026-02-12
**Agent**: jira-specialist
**MCP Server**: atlassian (Jira + Confluence)
