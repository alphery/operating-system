# 📝 Office Suite Implementation Plan for Alphery OS

## 🎯 **Overview**

Create a complete office productivity suite with three apps:
1. **AlpheryDocs** - Word processor with real-time collaboration
2. **AlpherySheets** - Spreadsheet application with formulas
3. **AlpherySlides** - Presentation creator

All apps will support:
- ✅ **Offline-first architecture** with local storage
- ✅ **Real-time collaboration** using Socket.IO
- ✅ **Cloud sync** via Supabase Storage
- ✅ **Export/Import** (.docx, .xlsx, .pptx formats)
- ✅ **Version history** and auto-save
- ✅ **Rich editing** capabilities

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    OFFICE SUITE APPS                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AlpheryDocs  │  │AlpherySheets │  │AlpherySlides │  │
│  │   (Word)     │  │   (Excel)    │  │ (PowerPoint) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│         ┌─────────────────┴─────────────────┐           │
│         │                                   │           │
│  ┌──────▼────────┐                 ┌────────▼────────┐  │
│  │ Local Storage │                 │  Socket.IO      │  │
│  │ (IndexedDB)   │                 │  (Real-time)    │  │
│  └──────┬────────┘                 └────────┬────────┘  │
│         │                                   │           │
│         └─────────────────┬─────────────────┘           │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │  Supabase       │                    │
│                  │  Storage + DB   │                    │
│                  └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 **Required Dependencies**

### **Frontend (Next.js)**
```json
{
  "dependencies": {
    // Rich Text Editing
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-collaboration": "^2.1.13",
    "@tiptap/extension-collaboration-cursor": "^2.1.13",
    
    // Spreadsheet
    "handsontable": "^14.0.0",
    "@handsontable/react": "^14.0.0",
    "formula.js": "^1.2.1",
    
    // Presentation
    "react-grid-layout": "^1.4.4",
    "fabric": "^5.3.0",
    
    // File Format Support
    "docx": "^8.5.0",
    "xlsx": "^0.18.5",
    "pptxgenjs": "^3.12.0",
    "mammoth": "^1.6.0",
    
    // Offline Support
    "dexie": "^3.2.4",
    "workbox-webpack-plugin": "^7.0.0",
    
    // Real-time Collaboration
    "y-websocket": "^1.5.0",
    "yjs": "^13.6.10",
    
    // Already installed
    "socket.io-client": "^4.8.3"
  }
}
```

### **Backend (NestJS)**
```json
{
  "dependencies": {
    // Already have Socket.IO
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    
    // Document conversion
    "libreoffice-convert": "^1.6.0",
    
    // File processing
    "sharp": "^0.33.0"
  }
}
```

---

## 🗄️ **Database Schema**

### **Prisma Schema Updates**

```prisma
// Add to backend/prisma/schema.prisma

model Document {
  id            String   @id @default(uuid())
  title         String
  type          DocumentType // DOCUMENT, SPREADSHEET, PRESENTATION
  content       Json     // Stores document content
  version       Int      @default(1)
  
  // Ownership
  ownerId       String
  owner         PlatformUser @relation(fields: [ownerId], references: [id])
  tenantId      String?
  tenant        Tenant?  @relation(fields: [tenantId], references: [id])
  
  // Collaboration
  collaborators DocumentCollaborator[]
  shareLink     String?  @unique
  isPublic      Boolean  @default(false)
  
  // File info
  fileSize      Int      @default(0)
  mimeType      String?
  storagePath   String?  // Path in Supabase Storage
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastEditedBy  String?
  
  // Version history
  versions      DocumentVersion[]
  
  @@index([ownerId])
  @@index([tenantId])
  @@index([type])
}

model DocumentCollaborator {
  id           String   @id @default(uuid())
  documentId   String
  document     Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId       String
  user         PlatformUser @relation(fields: [userId], references: [id])
  permission   CollaboratorPermission // VIEW, EDIT, COMMENT
  
  createdAt    DateTime @default(now())
  
  @@unique([documentId, userId])
  @@index([documentId])
  @@index([userId])
}

model DocumentVersion {
  id           String   @id @default(uuid())
  documentId   String
  document     Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  version      Int
  content      Json
  
  createdBy    String
  creator      PlatformUser @relation(fields: [createdBy], references: [id])
  createdAt    DateTime @default(now())
  
  @@unique([documentId, version])
  @@index([documentId])
}

model ActiveSession {
  id           String   @id @default(uuid())
  documentId   String
  userId       String
  user         PlatformUser @relation(fields: [userId], references: [id])
  cursor       Json?    // Cursor position for collaboration
  
  lastActive   DateTime @default(now())
  
  @@unique([documentId, userId])
  @@index([documentId])
}

enum DocumentType {
  DOCUMENT      // Word-like
  SPREADSHEET   // Excel-like
  PRESENTATION  // PowerPoint-like
}

enum CollaboratorPermission {
  VIEW
  COMMENT
  EDIT
}
```

---

## 🎨 **Frontend Implementation**

### **1. AlpheryDocs (Word Processor)**

**Technology Stack:**
- **Editor**: TipTap (ProseMirror-based)
- **Collaboration**: Yjs + Socket.IO
- **Export**: docx library
- **Import**: mammoth library

**Features:**
- Rich text formatting (bold, italic, underline, colors)
- Headings, lists, tables
- Images and media
- Page layout settings
- Comments and suggestions
- Real-time cursor tracking
- Export to PDF, DOCX
- Import from DOCX, TXT

**File Structure:**
```
components/apps/alphery_docs/
├── index.tsx                 # Main app component
├── Editor.tsx                # TipTap editor wrapper
├── Toolbar.tsx               # Formatting toolbar
├── Sidebar.tsx               # Document outline, comments
├── CollaborationBar.tsx      # Active users, share button
├── MenuBar.tsx               # File, Edit, View menus
├── hooks/
│   ├── useDocument.ts        # Document CRUD operations
│   ├── useCollaboration.ts   # Real-time sync
│   └── useOfflineSync.ts     # Offline support
├── utils/
│   ├── export.ts             # Export to DOCX, PDF
│   ├── import.ts             # Import from DOCX
│   └── templates.ts          # Document templates
└── styles/
    └── editor.module.css     # Editor styles
```

---

### **2. AlpherySheets (Spreadsheet)**

**Technology Stack:**
- **Grid**: Handsontable
- **Formulas**: formula.js
- **Charts**: Chart.js
- **Export**: xlsx library

**Features:**
- Excel-like grid interface
- Formula support (SUM, AVERAGE, VLOOKUP, etc.)
- Cell formatting (colors, borders, alignment)
- Charts and graphs
- Multiple sheets/tabs
- Freeze panes
- Sort and filter
- Real-time collaboration
- Export to XLSX, CSV
- Import from XLSX, CSV

**File Structure:**
```
components/apps/alphery_sheets/
├── index.tsx                 # Main app component
├── Spreadsheet.tsx           # Handsontable wrapper
├── FormulaBar.tsx            # Formula input
├── Toolbar.tsx               # Formatting toolbar
├── SheetTabs.tsx             # Sheet navigation
├── ChartBuilder.tsx          # Chart creation
├── hooks/
│   ├── useSpreadsheet.ts     # Spreadsheet operations
│   ├── useFormulas.ts        # Formula evaluation
│   └── useCharts.ts          # Chart management
├── utils/
│   ├── formulas.ts           # Custom formula functions
│   ├── export.ts             # Export to XLSX, CSV
│   └── import.ts             # Import from XLSX, CSV
└── styles/
    └── spreadsheet.module.css
```

---

### **3. AlpherySlides (Presentation)**

**Technology Stack:**
- **Canvas**: Fabric.js
- **Layout**: React Grid Layout
- **Export**: PptxGenJS
- **Animations**: Framer Motion

**Features:**
- Slide-based interface
- Text boxes, shapes, images
- Slide transitions
- Presenter mode
- Speaker notes
- Slide master/themes
- Real-time collaboration
- Export to PPTX, PDF
- Import from PPTX

**File Structure:**
```
components/apps/alphery_slides/
├── index.tsx                 # Main app component
├── SlideCanvas.tsx           # Fabric.js canvas
├── SlideList.tsx             # Slide thumbnails
├── Toolbar.tsx               # Formatting toolbar
├── PresenterView.tsx         # Presentation mode
├── ThemeSelector.tsx         # Slide themes
├── hooks/
│   ├── usePresentation.ts    # Presentation operations
│   ├── useSlides.ts          # Slide management
│   └── useAnimations.ts      # Transition effects
├── utils/
│   ├── export.ts             # Export to PPTX, PDF
│   ├── import.ts             # Import from PPTX
│   └── themes.ts             # Predefined themes
└── styles/
    └── slides.module.css
```

---

## 🔄 **Real-time Collaboration**

### **Socket.IO Events**

```typescript
// Backend: backend/src/collaboration/collaboration.gateway.ts

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN }
})
export class CollaborationGateway {
  
  // Join document room
  @SubscribeMessage('join-document')
  handleJoinDocument(
    @MessageBody() data: { documentId: string, userId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(`doc-${data.documentId}`);
    this.server.to(`doc-${data.documentId}`).emit('user-joined', {
      userId: data.userId,
      timestamp: new Date()
    });
  }
  
  // Broadcast changes
  @SubscribeMessage('document-change')
  handleDocumentChange(
    @MessageBody() data: { documentId: string, changes: any },
    @ConnectedSocket() client: Socket
  ) {
    client.to(`doc-${data.documentId}`).emit('document-update', data.changes);
  }
  
  // Cursor position
  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @MessageBody() data: { documentId: string, userId: string, position: any },
    @ConnectedSocket() client: Socket
  ) {
    client.to(`doc-${data.documentId}`).emit('cursor-update', {
      userId: data.userId,
      position: data.position
    });
  }
  
  // Leave document
  @SubscribeMessage('leave-document')
  handleLeaveDocument(
    @MessageBody() data: { documentId: string, userId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(`doc-${data.documentId}`);
    this.server.to(`doc-${data.documentId}`).emit('user-left', {
      userId: data.userId
    });
  }
}
```

---

## 💾 **Offline Support**

### **IndexedDB with Dexie**

```typescript
// utils/offlineDB.ts

import Dexie, { Table } from 'dexie';

interface OfflineDocument {
  id: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  title: string;
  content: any;
  lastModified: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

class OfflineDatabase extends Dexie {
  documents!: Table<OfflineDocument>;
  
  constructor() {
    super('AlpheryOfficeDB');
    this.version(1).stores({
      documents: 'id, type, syncStatus, lastModified'
    });
  }
}

export const offlineDB = new OfflineDatabase();

// Sync when online
export async function syncOfflineDocuments() {
  const pendingDocs = await offlineDB.documents
    .where('syncStatus')
    .equals('pending')
    .toArray();
  
  for (const doc of pendingDocs) {
    try {
      await uploadToSupabase(doc);
      await offlineDB.documents.update(doc.id, { syncStatus: 'synced' });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

---

## 📤 **Export/Import Functionality**

### **AlpheryDocs Export**

```typescript
// components/apps/alphery_docs/utils/export.ts

import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export async function exportToDocx(content: any, title: string) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: convertTipTapToDocx(content)
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
}

function convertTipTapToDocx(content: any): Paragraph[] {
  // Convert TipTap JSON to DOCX paragraphs
  return content.content.map((node: any) => {
    if (node.type === 'paragraph') {
      return new Paragraph({
        children: node.content?.map((text: any) => 
          new TextRun({
            text: text.text,
            bold: text.marks?.some((m: any) => m.type === 'bold'),
            italics: text.marks?.some((m: any) => m.type === 'italic')
          })
        ) || []
      });
    }
    // Handle other node types...
  });
}
```

### **AlpherySheets Export**

```typescript
// components/apps/alphery_sheets/utils/export.ts

import * as XLSX from 'xlsx';

export function exportToXlsx(data: any[][], title: string) {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${title}.xlsx`);
}

export function importFromXlsx(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      resolve(jsonData as any[][]);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

---

## 🎯 **Implementation Steps**

### **Phase 1: Setup & Dependencies (Week 1)**
1. ✅ Install all required npm packages
2. ✅ Update Prisma schema with Document models
3. ✅ Run migrations and update backend
4. ✅ Create base app components structure

### **Phase 2: AlpheryDocs (Week 2-3)**
1. ✅ Implement TipTap editor with toolbar
2. ✅ Add document save/load from Supabase
3. ✅ Implement offline support with IndexedDB
4. ✅ Add real-time collaboration with Socket.IO
5. ✅ Implement export to DOCX/PDF
6. ✅ Implement import from DOCX
7. ✅ Add version history

### **Phase 3: AlpherySheets (Week 4-5)**
1. ✅ Implement Handsontable grid
2. ✅ Add formula support
3. ✅ Implement cell formatting
4. ✅ Add charts and graphs
5. ✅ Implement offline support
6. ✅ Add real-time collaboration
7. ✅ Implement export/import XLSX

### **Phase 4: AlpherySlides (Week 6-7)**
1. ✅ Implement Fabric.js canvas
2. ✅ Add slide management
3. ✅ Implement text boxes and shapes
4. ✅ Add themes and templates
5. ✅ Implement presenter mode
6. ✅ Add real-time collaboration
7. ✅ Implement export/import PPTX

### **Phase 5: Integration & Polish (Week 8)**
1. ✅ Integrate with File Manager
2. ✅ Add apps to apps.config.js
3. ✅ Create app icons
4. ✅ Add to App Store
5. ✅ Testing and bug fixes
6. ✅ Documentation

---

## 🚀 **Quick Start Commands**

### **1. Install Dependencies**
```bash
# Frontend
cd "d:\Github Desktop\operating-system"
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor handsontable @handsontable/react formula.js react-grid-layout fabric docx xlsx pptxgenjs mammoth dexie yjs y-websocket

# Backend
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io
```

### **2. Update Database**
```bash
cd backend
npx prisma migrate dev --name add_office_suite_models
```

### **3. Start Development**
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd ..
npm run dev
```

---

## 📱 **App Configuration**

Add to `apps.config.js`:

```javascript
{
  id: "alphery-docs",
  title: "Alphery Docs",
  icon: './themes/Yaru/apps/libreoffice-writer.png',
  disabled: false,
  favourite: true,
  desktop_shortcut: false,
  screen: displayAlpheryDocs,
},
{
  id: "alphery-sheets",
  title: "Alphery Sheets",
  icon: './themes/Yaru/apps/libreoffice-calc.png',
  disabled: false,
  favourite: true,
  desktop_shortcut: false,
  screen: displayAlpherySheets,
},
{
  id: "alphery-slides",
  title: "Alphery Slides",
  icon: './themes/Yaru/apps/libreoffice-impress.png',
  disabled: false,
  favourite: true,
  desktop_shortcut: false,
  screen: displayAlpherySlides,
}
```

---

## 🎨 **UI/UX Design**

### **Common Design Principles**
- Clean, modern interface inspired by Google Workspace
- Consistent toolbar across all apps
- Floating action buttons for quick actions
- Keyboard shortcuts for power users
- Responsive design for different window sizes
- Dark mode support

### **Color Scheme**
- **AlpheryDocs**: Blue theme (#4285F4)
- **AlpherySheets**: Green theme (#0F9D58)
- **AlpherySlides**: Orange theme (#F4B400)

---

## 🔒 **Security Considerations**

1. **Authentication**: All documents require Firebase auth
2. **Authorization**: Check user permissions before edit/view
3. **Data Validation**: Sanitize all user input
4. **File Size Limits**: Max 50MB per document
5. **Rate Limiting**: Prevent spam/abuse
6. **Encryption**: Encrypt sensitive documents at rest

---

## 📊 **Performance Optimization**

1. **Lazy Loading**: Load editor libraries only when app opens
2. **Virtual Scrolling**: For large spreadsheets
3. **Debouncing**: Auto-save every 3 seconds
4. **Compression**: Compress document content in DB
5. **CDN**: Serve static assets from CDN
6. **Caching**: Cache frequently accessed documents

---

## 🧪 **Testing Strategy**

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test collaboration features
3. **E2E Tests**: Test complete workflows
4. **Performance Tests**: Load testing with large documents
5. **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge

---

## 📚 **Documentation Needed**

1. User guide for each app
2. Keyboard shortcuts reference
3. API documentation for collaboration
4. Developer guide for extending features
5. Troubleshooting guide

---

## 🎯 **Success Metrics**

- ✅ All three apps functional and integrated
- ✅ Real-time collaboration working smoothly
- ✅ Offline mode with proper sync
- ✅ Export/Import working for all formats
- ✅ Performance: <100ms response time for edits
- ✅ Reliability: 99.9% uptime
- ✅ User satisfaction: Positive feedback

---

## 🚀 **Next Steps**

1. **Approve this plan** - Let me know if you want any changes
2. **Start with AlpheryDocs** - I'll create the first app
3. **Test and iterate** - Get feedback and improve
4. **Add AlpherySheets** - Build the spreadsheet app
5. **Complete with AlpherySlides** - Finish with presentations
6. **Launch!** - Deploy to production

---

**Ready to start building? Which app should we create first?** 🚀

I recommend starting with **AlpheryDocs** as it's the most straightforward and will establish patterns for the other apps.
