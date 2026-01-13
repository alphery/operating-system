# Alphery Projects App - Enhanced Multi-Section Guide

## Overview
The Alphery Projects app has been upgraded with a powerful multi-section navigation system that allows you to manage **Quotations**, **Projects**, **Documents**, and **Process** all from one unified interface.

## Features

### 1. **Section Navigation Dropdown**
Located at the top of the app, you can switch between four main sections:
- 📋 **Quotations** - Manage sales quotations
- 🚀 **Projects** - Manage your team's projects (original functionality)
- 📁 **Documents** - Organize project-related documents
- ⚙️ **Process** - Coming Soon!

### 2. **Quotations Section**
Manage all your quotations in one place with the following statuses:
- **Planned** - Quotations being prepared
- **In Progress** - Quotations being worked on
- **Sent** - Quotations sent to clients

**Features:**
- Create new quotations with title, client, amount, and validity date
- Edit existing quotations
- Delete quotations
- View all quotations in a clean table view
- Track quotation status and amounts

**CRUD Operations:**
- ✅ **Create**: Click "New Quotation" button
- ✅ **Read**: View all quotations in the table
- ✅ **Update**: Click on any quotation to edit
- ✅ **Delete**: Click the Delete button on each quotation

### 3. **Projects Section**
The original Projects functionality remains intact with all features:
- Kanban board view
- List view
- Analytics dashboard
- Create, edit, and delete projects
- Track progress, budget, and team members
- Filter by status and priority

### 4. **Documents Section**
Organize all project-related documents efficiently.

**Document Types:**
- **Contract** - Legal agreements
- **Invoice** - Billing documents
- **Proposal** - Project proposals
- **Report** - Project reports

**Features:**
- Link documents to specific projects
- Track who uploaded each document
- Store document URLs (Google Drive, etc.)
- Add descriptions and metadata
- Filter and search documents

**CRUD Operations:**
- ✅ **Create**: Click "New Document" button
- ✅ **Read**: View all documents in the table
- ✅ **Update**: Click on any document to edit
- ✅ **Delete**: Click the Delete button on each document

### 5. **Process Section**
**Status**: Coming Soon!

The Process section is under development and will include:
- ✓ Automated workflow templates
- ✓ Process visualization and tracking
- ✓ Team collaboration tools
- ✓ Performance analytics

## How to Use

### Switching Sections
1. Click the dropdown at the top of the app
2. Select the section you want to view
3. The interface will update to show that section's content

### Creating Items
1. Navigate to the desired section using the dropdown
2. Click the "New [Item]" button (color-coded by section)
   - **Green** for Projects
   - **Blue** for Quotations
   - **Purple** for Documents
3. Fill in the form fields
4. Click "Create" or "Update"

### Editing Items
1. Click on any item in the table/board
2. The edit modal will open with pre-filled data
3. Make your changes
4. Click "Update"

### Deleting Items
1. Click the "Delete" button on any item
2. Confirm the deletion
3. The item will be removed immediately

## Firebase Integration

All sections use Firebase Firestore for data persistence:

### Collections Structure:
```
- quotations/
  - title
  - client
  - status
  - amount
  - validUntil
  - description
  - createdAt
  - updatedAt

- projects/
  (existing structure)

- documents/
  - title
  - type
  - projectId
  - uploadedBy
  - uploadedDate
  - fileUrl
  - description
  - status
  - createdAt
  - updatedAt
```

## Demo Mode

If Firebase is not configured, the app runs in demo mode with empty data, allowing you to still explore the interface.

## UI Design

Each section has its own color scheme for easy identification:
- **Quotations**: Blue theme
- **Projects**: Green theme
- **Documents**: Purple theme
- **Process**: Orange/Amber theme

## Tips for Best Results

1. **Quotations**: Set realistic validity dates to track expired quotes
2. **Projects**: Use the Kanban view for visual workflow management
3. **Documents**: Always link documents to projects for better organization
4. **Search**: Use the search bar to quickly find projects (more search coming soon)

## Keyboard Shortcuts (Projects Section)

- `Cmd/Ctrl + N` - Create new project
- `Cmd/Ctrl + K` - Focus search
- `Cmd/Ctrl + D` - Toggle dark mode
- `Cmd/Ctrl + E` - Export to Excel

## Future Enhancements

- Search and filter for Quotations and Documents
- Bulk operations (delete, export multiple items)
- Document preview and download
- Quotation templates
- Email integration for sending quotations
- Process automation workflows

---

**Built with ❤️ for Alphery Team**
