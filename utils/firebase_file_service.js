import { storage, db } from '../config/firebase';
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
    static getUserCollection(userUid) {
        if (!userUid) return null;
        return collection(db, 'users', userUid, 'files');
    }

    // Get contents of a specific folder
    static async getFiles(userUid, parentId = 'root') {
        if (!userUid) throw new Error("User UID required");

        try {
            const q = query(
                this.getUserCollection(userUid),
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
    static async createFolder(userUid, name, parentId = 'root', currentPath = []) {
        if (!userUid) throw new Error("User UID required");

        try {
            await addDoc(this.getUserCollection(userUid), {
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
    static async uploadFile(userUid, file, parentId = 'root', currentPath = [], onProgress) {
        if (!userUid) throw new Error("User UID required");

        const timestamp = Date.now();
        // Create unique filename for storage to avoid collisions, but keep display name in Firestore
        const uniqueFilename = `${timestamp}_${file.name}`;
        const storagePath = `users/${userUid}/files/${uniqueFilename}`;
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
                        await addDoc(this.getUserCollection(userUid), {
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
    static async moveToTrash(userUid, item) {
        if (!userUid) throw new Error("User UID required");
        try {
            const itemRef = doc(db, 'users', userUid, 'files', item.id);
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
    static async restoreFromTrash(userUid, item) {
        if (!userUid) throw new Error("User UID required");
        try {
            const itemRef = doc(db, 'users', userUid, 'files', item.id);
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
    static subscribeToTrash(userUid, callback) {
        if (!userUid) return () => { };

        const q = query(
            this.getUserCollection(userUid),
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
    static subscribeToFolder(userUid, parentId, callback) {
        if (!userUid) return () => { };

        const q = query(
            this.getUserCollection(userUid),
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
    static async getTrashedFiles(userUid) {
        if (!userUid) throw new Error("User UID required");
        try {
            const q = query(
                this.getUserCollection(userUid),
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
    static async permanentlyDelete(userUid, item) {
        if (!userUid) throw new Error("User UID required");

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', userUid, 'files', item.id));

            // If it's a file, delete from Storage
            if (!item.isFolder && item.storagePath) {
                const storageRef = ref(storage, item.storagePath);
                await deleteObject(storageRef).catch(e => console.warn("Storage delete failed (might be missing):", e));
            } else if (item.isFolder) {
                // Recursive delete for permanently deleting a folder
                const q = query(
                    this.getUserCollection(userUid),
                    where("parentId", "==", item.id)
                );
                const childrenSnapshot = await getDocs(q);
                const children = [];
                childrenSnapshot.forEach((doc) => children.push({ id: doc.id, ...doc.data() }));

                for (const child of children) {
                    await this.permanentlyDelete(userUid, child);
                }
            }
        } catch (error) {
            console.error("Error deleting item permanently:", error);
            throw error;
        }
    }

    // Empty Trash
    static async emptyTrash(userUid) {
        const files = await this.getTrashedFiles(userUid);
        for (const file of files) {
            await this.permanentlyDelete(userUid, file);
        }
    }

    // Legacy Delete (Redirects to moveToTrash for backward compatibility with UI calls)
    static async deleteItem(userUid, item) {
        return this.moveToTrash(userUid, item);
    }

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
    static async renameItem(userUid, itemId, newName) {
        if (!userUid) throw new Error("User UID required");
        try {
            const itemRef = doc(db, 'users', userUid, 'files', itemId);
            await updateDoc(itemRef, { name: newName });
        } catch (error) {
            console.error("Error renaming item:", error);
            throw error;
        }
    }

    // Get total storage usage
    static async getStorageStats(userUid) {
        if (!userUid) return { used: 0, count: 0 };
        try {
            const q = query(this.getUserCollection(userUid));
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
    static async toggleStar(userUid, itemId, isStarred) {
        if (!userUid) throw new Error("User UID required");
        try {
            const itemRef = doc(db, 'users', userUid, 'files', itemId);
            await updateDoc(itemRef, { isStarred: !isStarred });
        } catch (error) {
            console.error("Error toggling star:", error);
            throw error;
        }
    }
}
