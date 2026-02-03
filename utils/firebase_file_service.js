import { storage, db, auth } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    onSnapshot
} from 'firebase/firestore';

export default class FirebaseFileService {

    // Get the current user's file collection reference
    static getUserCollection() {
        if (!auth.currentUser) return null;
        return collection(db, 'users', auth.currentUser.uid, 'files');
    }

    // Get contents of a specific folder
    static async getFiles(parentId = 'root') {
        if (!auth.currentUser) throw new Error("User not authenticated");

        try {
            const q = query(
                this.getUserCollection(),
                where("parentId", "==", parentId)
            );

            const querySnapshot = await getDocs(q);
            const files = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.isTrashed) {
                    files.push({ id: doc.id, ...data });
                }
            });

            // Sort: folders first, then files, alphabetically
            return files.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            console.error("Error fetching files:", error);
            throw error;
        }
    }

    // Create a new folder
    static async createFolder(name, parentId = 'root', currentPath = []) {
        if (!auth.currentUser) throw new Error("User not authenticated");

        try {
            await addDoc(this.getUserCollection(), {
                name: name,
                isFolder: true,
                parentId: parentId,
                path: currentPath,
                createdAt: serverTimestamp(),
                size: 0,
                type: 'folder'
            });
        } catch (error) {
            console.error("Error creating folder:", error);
            throw error;
        }
    }

    // Upload a file
    static async uploadFile(file, parentId = 'root', currentPath = [], onProgress) {
        if (!auth.currentUser) throw new Error("User not authenticated");

        const timestamp = Date.now();
        // Create unique filename for storage to avoid collisions, but keep display name in Firestore
        const uniqueFilename = `${timestamp}_${file.name}`;
        const storagePath = `users/${auth.currentUser.uid}/files/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // Add metadata to Firestore
                        await addDoc(this.getUserCollection(), {
                            name: file.name,
                            isFolder: false,
                            parentId: parentId,
                            path: currentPath,
                            createdAt: serverTimestamp(),
                            size: file.size,
                            type: this.getFileType(file.name),
                            url: downloadURL,
                            storagePath: storagePath // Save this to delete later
                        });

                        resolve(downloadURL);
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        });
    }

    // Move to Trash (Soft Delete)
    static async moveToTrash(item) {
        if (!auth.currentUser) throw new Error("User not authenticated");
        try {
            const itemRef = doc(db, 'users', auth.currentUser.uid, 'files', item.id);
            await updateDoc(itemRef, {
                isTrashed: true,
                trashedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error moving to trash:", error);
            throw error;
        }
    }

    // Restore from Trash
    static async restoreFromTrash(item) {
        if (!auth.currentUser) throw new Error("User not authenticated");
        try {
            const itemRef = doc(db, 'users', auth.currentUser.uid, 'files', item.id);
            await updateDoc(itemRef, {
                isTrashed: false,
                trashedAt: null
            });
        } catch (error) {
            console.error("Error restoring from trash:", error);
            throw error;
        }
    }

    // Real-time Trash Listener
    static subscribeToTrash(callback) {
        if (!auth.currentUser) return () => { };

        const q = query(
            this.getUserCollection(),
            where("isTrashed", "==", true)
        );

        return onSnapshot(q, (snapshot) => {
            const files = [];
            snapshot.forEach((doc) => {
                files.push({ id: doc.id, ...doc.data() });
            });
            callback(files);
        }, (error) => {
            console.error("Trash subscription error:", error);
        });
    }

    // Real-time Folder Listener
    static subscribeToFolder(parentId, callback) {
        if (!auth.currentUser) return () => { };

        const q = query(
            this.getUserCollection(),
            where("parentId", "==", parentId)
        );

        return onSnapshot(q, (snapshot) => {
            const files = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.isTrashed) {
                    files.push({ id: doc.id, ...data });
                }
            });
            // Sort: folders first, then files, alphabetically
            files.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.name.localeCompare(b.name);
            });
            callback(files);
        }, (error) => {
            console.error("Folder subscription error:", error);
        });
    }

    // Get Trashed Files (One-time fetch - Legacy)
    static async getTrashedFiles() {
        if (!auth.currentUser) throw new Error("User not authenticated");
        try {
            const q = query(
                this.getUserCollection(),
                where("isTrashed", "==", true)
            );
            const querySnapshot = await getDocs(q);
            const files = [];
            querySnapshot.forEach((doc) => {
                files.push({ id: doc.id, ...doc.data() });
            });
            return files;
        } catch (error) {
            console.error("Error fetching trashed files:", error);
            throw error;
        }
    }

    // Permanently Delete
    static async permanentlyDelete(item) {
        if (!auth.currentUser) throw new Error("User not authenticated");

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'files', item.id));

            // If it's a file, delete from Storage
            if (!item.isFolder && item.storagePath) {
                const storageRef = ref(storage, item.storagePath);
                await deleteObject(storageRef).catch(e => console.warn("Storage delete failed (might be missing):", e));
            } else if (item.isFolder) {
                // Recursive delete for permanently deleting a folder
                // Note: We need to find children even if they are trashed or not, strictly speaking
                // But if the folder is in trash, its children effectively are too.
                // We'll search for children by parentId, regardless of trash status.
                const q = query(
                    this.getUserCollection(),
                    where("parentId", "==", item.id)
                );
                const childrenSnapshot = await getDocs(q);
                const children = [];
                childrenSnapshot.forEach((doc) => children.push({ id: doc.id, ...doc.data() }));

                for (const child of children) {
                    await this.permanentlyDelete(child);
                }
            }
        } catch (error) {
            console.error("Error deleting item permanently:", error);
            throw error;
        }
    }

    // Empty Trash
    static async emptyTrash() {
        const files = await this.getTrashedFiles();
        for (const file of files) {
            await this.permanentlyDelete(file);
        }
    }

    // Legacy Delete (Redirects to moveToTrash for backward compatibility with UI calls)
    static async deleteItem(item) {
        return this.moveToTrash(item);
    }

    // Initialize root folder if it doesn't exist (Optional, technically 'root' parentId implies it)
    // No specific initialization needed for Firestore approach as it's just a query.

    static getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'svg': 'image',
            'mp4': 'video', 'mov': 'video', 'avi': 'video',
            'mp3': 'audio', 'wav': 'audio',
            'pdf': 'pdf',
            'doc': 'document', 'docx': 'document',
            'xls': 'spreadsheet', 'xlsx': 'spreadsheet',
            'ppt': 'presentation', 'pptx': 'presentation',
            'zip': 'archive', 'rar': 'archive',
            'txt': 'text', 'md': 'text', 'js': 'code', 'css': 'code', 'html': 'code'
        };
        return types[ext] || 'file';
    }

    // Rename a file or folder
    static async renameItem(itemId, newName) {
        if (!auth.currentUser) throw new Error("User not authenticated");
        try {
            const itemRef = doc(db, 'users', auth.currentUser.uid, 'files', itemId);
            await updateDoc(itemRef, { name: newName });
        } catch (error) {
            console.error("Error renaming item:", error);
            throw error;
        }
    }

    // Get total storage usage
    static async getStorageStats() {
        if (!auth.currentUser) return { used: 0, count: 0 };
        try {
            const q = query(this.getUserCollection());
            const snapshot = await getDocs(q);
            let totalSize = 0;
            let fileCount = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.isFolder) {
                    totalSize += data.size || 0;
                    fileCount++;
                }
            });
            return { used: totalSize, count: fileCount };
        } catch (error) {
            console.error("Error calculating stats:", error);
            return { used: 0, count: 0 };
        }
    }

    // Toggle star status
    static async toggleStar(itemId, isStarred) {
        if (!auth.currentUser) throw new Error("User not authenticated");
        try {
            const itemRef = doc(db, 'users', auth.currentUser.uid, 'files', itemId);
            await updateDoc(itemRef, { isStarred: !isStarred });
        } catch (error) {
            console.error("Error toggling star:", error);
            throw error;
        }
    }
}
