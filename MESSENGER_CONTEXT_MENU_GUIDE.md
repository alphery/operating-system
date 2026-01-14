# 🔒 Messenger Context Menu & Chat Management - Implementation Summary

## ✅ What I've Done

I've added the foundation for context menu and chat management:

1. **Added State Variables** (Line ~27-29)
   - `contextMenu`: Tracks open context menu
   - `hiddenUsers`: Array of hidden user IDs

2. **Added Context Menu Handlers** (Lines ~273-422)
   - `closeContextMenu()` - Close menu on click
   - `handleUserContextMenu()` - Right-click on user in sidebar
   - `handleMessageContextMenu()` - Right-click on message
   - `hideUser()` - Hide a chat (localStorage)
   - `unhideUser()` - Unhide a chat
   - `deleteUserChat()` - Delete all messages with a user (super admin)
   - `deleteMessage()` - Delete a single message

3. **Updated Lifecycle Methods** (Lines 35-60)
   - Load hidden users from localStorage
   - Add/remove context menu listeners

## 🔧 What You Need to Do

### Step 1: Add Context Menu to User List

Find the user list rendering (around line 407 in the sidebar). Update it to:

```javascript
{otherUsers.filter(u =>
    !this.state.hiddenUsers.includes(u.uid) && ( // Filter hidden users
        !this.state.searchQuery ||
        (u.displayName && u.displayName.toLowerCase().includes(this.state.searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
    )
).map(user => (
    <div key={user.uid}
        onClick={() => this.selectUser(user)}
        onContextMenu={(e) => this.handleUserContextMenu(e, user)} // Add this line
        className={`flex items-center px-4 py-3 cursor-pointer transition border-b border-gray-100 group
        ${selectedUser && selectedUser.uid === user.uid ? '

bg-teal-50 border-teal-200' : 'hover:bg-gray-100'}`}>
        {/* ... rest of user item ... */}
    </div>
))}
```

### Step 2: Add Context Menu to Messages

In the `renderMessage` method (around line 429), wrap each message with context menu handler:

For text messages (around line 507):
```javascript
<div 
    key={msg.id} 
    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}
    onContextMenu={(e) => this.handleMessageContextMenu(e, msg)} // Add this
>
    {/* ... rest of message ... */}
</div>
```

Do the same for image messages (line ~446), video messages (line ~466), and file messages (line ~482).

### Step 3: Render Context Menu UI

Add this right before the closing `</div>` of the main container (around line 720):

```javascript
{/* Context Menu */}
{this.state.contextMenu && (
    <div 
        className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px]"
        style={{
            left: `${this.state.contextMenu.x}px`,
            top: `${this.state.contextMenu.y}px`
        }}
        onClick={(e) => e.stopPropagation()}
    >
        {this.state.contextMenu.type === 'user' && (
            <>
                <button
                    onClick={() => this.hideUser(this.state.contextMenu.item)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700"
                >
                    <span>👁️‍🗨️</span>
                    <span>Hide Chat</span>
                </button>
                <button
                    onClick={() => this.deleteUserChat(this.state.contextMenu.item)}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                >
                    <span>🗑️</span>
                    <span>
                        {this.props.userData?.role === 'super_admin' 
                            ? '🔒 Delete (Super Admin)' 
                            : 'Delete Chat'}
                    </span>
                </button>
            </>
        )}
        
        {this.state.contextMenu.type === 'message' && (
            <button
                onClick={() => this.deleteMessage(this.state.contextMenu.item)}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
            >
                <span>🗑️</span>
                <span>
                    {this.props.userData?.role === 'super_admin'
                        ? '🔒 Delete for Everyone'
                        : 'Delete Message'}
                </span>
            </button>
        )}
    </div>
)}
```

### Step 4: Add "Show Hidden Chats" Option

Add a button in the sidebar header (after the search box, around line 399):

```javascript
{this.state.hiddenUsers.length > 0 && (
    <button
        onClick={() => this.setState({ showHiddenChats: !this.state.showHiddenChats })}
        className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
    >
        <span>👁️</span>
        <span>
            {this.state.showHiddenChats ? 'Hide' : 'Show'} Hidden Chats ({this.state.hiddenUsers.length})
        </span>
    </button>
)}

{/* Hidden chats list */}
{this.state.showHiddenChats && this.state.hiddenUsers.length > 0 && (
    <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
        <p className="text-xs font-bold text-gray-600 mb-2">Hidden Chats</p>
        {otherUsers.filter(u => this.state.hiddenUsers.includes(u.uid)).map(user => (
            <div key={user.uid} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600">{user.displayName || user.email}</span>
                <button
                    onClick={() => this.unhideUser(user.uid)}
                    className="text-xs text-teal-600 hover:text-teal-700"
                >
                    Unhide
                </button>
            </div>
        ))}
    </div>
)}
```

### Step 5: Add showHiddenChats to State

In the constructor state, add:
```javascript
showHiddenChats: false, // After hiddenUsers
```

## 🎯 How It Works

### For Regular Users:
1. **Right-click on a user** in sidebar → Shows "Hide Chat" and "Delete Chat"
   - "Hide Chat" → Hides the chat (localStorage, only for you)
   - "Delete Chat" → Actually just hides it (no global delete permission)

2. **Right-click on a message** → Shows "Delete Message"
   - Can only delete their own messages
   - Deletes for everyone in the conversation

### For Super Admin:
1. **Right-click on a user** → Shows "Hide Chat" and "🔒 Delete (Super Admin)"
   - "Delete" → Deletes ALL messages with that user FOR EVERYONE
   - Confirmation dialog shows "SUPER ADMIN" warning

2. **Right-click on a message** → Shows "🔒 Delete for Everyone"
   - Can delete ANY message (not just their own)
   - Deletes from Firestore completely

## 🔒 Permissions

- **Regular User:**
  - Hide chats (localStorage only, doesn't affect others)
  - Delete own messages (affects everyone)
  - Can't delete other people's messages

- **Super Admin:**
  - All regular user permissions
  - Delete entire chat histories (affects everyone)
  - Delete any message from anyone (affects everyone)
  - Special visual indicators (🔒 icon)

## 📝 Implementation Checklist

- [x] Add state variables
- [x] Add context menu handlers
- [x] Add hide/delete logic
- [ ] Add `onContextMenu` to user list items
- [ ] Add `onContextMenu` to all message types
- [ ] Add context menu UI rendering
- [ ] Add hidden chats section
- [ ] Add `showHiddenChats` to state
- [ ] Test as regular user
- [ ] Test as super admin

## 🧪 Testing

1. **Test Hide Chat:**
   - Right-click user → Hide Chat
   - User disappears from list
   - Click "Show Hidden Chats" → See it in hidden list
   - Click "Unhide" → User returns

2. **Test Delete Message (Regular User):**
   - Right-click YOUR message → Delete
   - Confirm → Message disappears for everyone

3. **Test Delete Message (Super Admin):**
   - Right-click ANY message → 🔒 Delete for Everyone
   - Confirm → Message deleted globally

4. **Test Delete Chat (Super Admin):**
   - Right-click user → 🔒 Delete (Super Admin)
   - Confirm → ALL messages deleted for everyone

## 🎉 Summary

The foundation is complete! Just add the UI hooks (onContextMenu handlers and context menu rendering) and you'll have a fully functional chat management system with super admin powers! 🚀
