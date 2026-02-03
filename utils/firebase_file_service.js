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
    updateDoc
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
                files.push({ id: doc.id, ...doc.data() });
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

    // Delete a file or folder
    static async deleteItem(item) {
        if (!auth.currentUser) throw new Error("User not authenticated");

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'files', item.id));

            // If it's a file, delete from Storage
            if (!item.isFolder && item.storagePath) {
                const storageRef = ref(storage, item.storagePath);
                await deleteObject(storageRef).catch(e => console.warn("Storage delete failed (might be missing):", e));
            } else if (item.isFolder) {
                // Warning: This implies recursive delete which is complex.
                // For a simple implementation, we might leave orphaned files or implement cloud functions.
                // Here we will try to delete children recursively on client side (careful with large folders)
                const children = await this.getFiles(item.id);
                for (const child of children) {
                    await this.deleteItem(child);
                }
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            throw error;
        }
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
}
