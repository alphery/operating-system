import React, { Component } from 'react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class Gallery extends Component {
    constructor() {
        super();
        this.state = {
            images: [],
            selectedImage: null,
            viewMode: 'grid',
            sortBy: 'date',
            searchQuery: '',
            isUploading: false,
            albums: ['All Photos', 'Favorites', 'Messenger'],
            currentAlbum: 'All Photos',
            favorites: new Set(),
            slideshow: false,
            loading: true,
            user: null
        };
        this.fileInputRef = React.createRef();
        this.slideshowInterval = null;
    }

    async componentDidMount() {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            this.setState({ user });
            await this.loadGallery(user.uid);
        } else {
            this.setState({ loading: false });
        }
    }

    componentWillUnmount() {
        if (this.slideshowInterval) clearInterval(this.slideshowInterval);
    }

    loadGallery = async (userId) => {
        try {
            this.setState({ loading: true });

            // Load images from Firestore
            const imagesRef = collection(db, 'gallery');
            const q = query(
                imagesRef,
                where('userId', '==', userId),
                orderBy('uploadedAt', 'desc')
            );
            const snapshot = await getDocs(q);

            const images = [];
            const favorites = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                images.push({
                    id: doc.id,
                    ...data
                });
                if (data.favorite) {
                    favorites.add(doc.id);
                }
            });

            this.setState({
                images,
                favorites,
                loading: false
            });
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.setState({ loading: false });
        }
    }

    handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const { user } = this.state;

        if (!user) {
            alert('Please sign in to upload photos');
            return;
        }

        this.setState({ isUploading: true });

        try {
            for (const file of files) {
                // Upload to Firebase Storage
                const timestamp = Date.now();
                const fileName = `${user.uid}/${timestamp}_${file.name}`;
                const storageRef = ref(storage, `gallery/${fileName}`);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                // Get image dimensions
                const img = new Image();
                const dimensions = await new Promise((resolve) => {
                    img.onload = () => {
                        resolve({ width: img.width, height: img.height });
                    };
                    img.src = URL.createObjectURL(file);
                });

                // Save metadata to Firestore
                await addDoc(collection(db, 'gallery'), {
                    userId: user.uid,
                    url: url,
                    storagePath: fileName,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    width: dimensions.width,
                    height: dimensions.height,
                    uploadedAt: new Date().toISOString(),
                    favorite: false,
                    source: 'upload',
                    album: 'All Photos'
                });
            }

            await this.loadGallery(user.uid);
            this.setState({ isUploading: false });
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload images: ' + error.message);
            this.setState({ isUploading: false });
        }
    }

    deleteImage = async (image) => {
        if (!confirm('Delete this image?')) return;

        try {
            // Delete from Storage
            const storageRef = ref(storage, `gallery/${image.storagePath}`);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(db, 'gallery', image.id));

            // Update local state
            this.setState(prev => ({
                images: prev.images.filter(img => img.id !== image.id),
                selectedImage: prev.selectedImage?.id === image.id ? null : prev.selectedImage,
                favorites: new Set([...prev.favorites].filter(id => id !== image.id))
            }));
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image: ' + error.message);
        }
    }

    downloadImage = async (image) => {
        try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = image.name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Failed to download image');
        }
    }

    toggleFavorite = async (imageId) => {
        try {
            const image = this.state.images.find(img => img.id === imageId);
            const newFavoriteStatus = !this.state.favorites.has(imageId);

            // Update Firestore
            await updateDoc(doc(db, 'gallery', imageId), {
                favorite: newFavoriteStatus
            });

            // Update local state
            this.setState(prev => {
                const newFavorites = new Set(prev.favorites);
                if (newFavoriteStatus) {
                    newFavorites.add(imageId);
                } else {
                    newFavorites.delete(imageId);
                }
                return { favorites: newFavorites };
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    startSlideshow = () => {
        const images = this.getFilteredImages();
        if (images.length === 0) return;

        this.setState({
            slideshow: true,
            selectedImage: images[0],
            viewMode: 'detail'
        });

        let currentIndex = 0;
        this.slideshowInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            this.setState({ selectedImage: images[currentIndex] });
        }, 3000);
    }

    stopSlideshow = () => {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
        this.setState({ slideshow: false });
    }

    getFilteredImages = () => {
        let filtered = [...this.state.images];

        // Filter by album
        if (this.state.currentAlbum === 'Favorites') {
            filtered = filtered.filter(img => this.state.favorites.has(img.id));
        } else if (this.state.currentAlbum === 'Messenger') {
            filtered = filtered.filter(img => img.source === 'messenger');
        }

        // Filter by search
        if (this.state.searchQuery) {
            filtered = filtered.filter(img =>
                img.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())
            );
        }

        // Sort
        if (this.state.sortBy === 'date') {
            filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        } else {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        return filtered;
    }

    formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    render() {
        const { selectedImage, viewMode, searchQuery, currentAlbum, albums, isUploading, slideshow, favorites, loading, user } = this.state;
        const filteredImages = this.getFilteredImages();

        if (!user) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-white">
                    <div className="text-center">
                        <div className="text-8xl mb-4">📸</div>
                        <p className="text-gray-600 text-lg mb-2">Please sign in to access Gallery</p>
                        <p className="text-gray-400 text-sm">Your photos are securely stored in the cloud</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-white text-gray-900 font-sans overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between px-6 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">📸</div>
                        <div>
                            <h1 className="font-bold text-xl">Photos</h1>
                            <p className="text-xs text-pink-100">{filteredImages.length} photos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search photos..."
                                value={searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-white bg-opacity-20 text-white placeholder-pink-100 border border-white border-opacity-30 rounded-lg focus:bg-opacity-30 focus:outline-none text-sm w-64"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-pink-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={() => this.fileInputRef.current.click()}
                            disabled={isUploading}
                            className="bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50 transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden flex-col sm:flex-row">
                    {/* Sidebar - Desktop / Bottom Nav - Mobile */}
                    <div className="hidden sm:flex w-64 bg-gray-50 border-r border-gray-200 flex-col p-4">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Albums</h3>
                            <div className="space-y-1">
                                {albums.map(album => {
                                    const count = album === 'All Photos' ? this.state.images.length :
                                        album === 'Favorites' ? favorites.size :
                                            this.state.images.filter(img => img.source === 'messenger').length;

                                    return (
                                        <button
                                            key={album}
                                            onClick={() => this.setState({ currentAlbum: album })}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition ${currentAlbum === album
                                                ? 'bg-pink-100 text-pink-700 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {album === 'Favorites' && '⭐ '}
                                            {album === 'Messenger' && '💬 '}
                                            {album}
                                            {count > 0 && ` (${count})`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Actions</h3>
                            <button
                                onClick={this.startSlideshow}
                                disabled={filteredImages.length === 0}
                                className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                ▶ Slideshow
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-auto pb-20 sm:pb-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading photos...</p>
                                </div>
                            </div>
                        ) : viewMode === 'grid' && !selectedImage ? (
                            /* Grid View */
                            <div className="p-6">
                                {filteredImages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="text-8xl mb-4">📷</div>
                                            <p className="text-gray-500 text-lg mb-2">
                                                {searchQuery ? 'No photos found' : currentAlbum === 'Messenger' ? 'No Messenger photos yet' : 'No photos yet'}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                {searchQuery ? 'Try a different search' : 'Upload some photos to get started'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {filteredImages.map(image => (
                                            <div
                                                key={image.id}
                                                onClick={() => this.setState({ selectedImage: image })}
                                                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-4 hover:ring-pink-500 transition relative group"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={image.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            this.toggleFavorite(image.id);
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-white/90 hover:bg-white transition flex items-center justify-center"
                                                    >
                                                        {favorites.has(image.id) ? '⭐' : '☆'}
                                                    </button>
                                                </div>
                                                {image.source === 'messenger' && (
                                                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                                        💬
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : selectedImage ? (
                            /* Detail View */
                            <div className="flex flex-col h-full">
                                {/* Image Viewer */}
                                <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
                                    {slideshow && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-semibold animate-pulse z-10">
                                            Slideshow
                                        </div>
                                    )}
                                    <img
                                        src={selectedImage.url}
                                        alt={selectedImage.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>

                                {/* Controls */}
                                <div className="h-20 bg-gray-900 text-white flex items-center justify-between px-6">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                this.stopSlideshow();
                                                this.setState({ selectedImage: null });
                                            }}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                                        >
                                            ← Back
                                        </button>
                                        <div>
                                            <p className="font-semibold">{selectedImage.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {selectedImage.width}×{selectedImage.height} • {this.formatFileSize(selectedImage.size)} • {this.formatDate(selectedImage.uploadedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {slideshow && (
                                            <button
                                                onClick={this.stopSlideshow}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                            >
                                                Stop Slideshow
                                            </button>
                                        )}
                                        <button
                                            onClick={() => this.toggleFavorite(selectedImage.id)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                                        >
                                            {favorites.has(selectedImage.id) ? '⭐' : '☆'}
                                        </button>
                                        <button
                                            onClick={() => this.downloadImage(selectedImage)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={() => this.deleteImage(selectedImage)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={this.handleFileUpload}
                    className="hidden"
                />

                {/* Upload Progress */}
                {isUploading && (
                    <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-2xl p-4 w-80 border border-gray-200 z-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full"></div>
                            <span className="font-semibold text-gray-800">Uploading to cloud...</span>
                        </div>
                    </div>
                )}

                {/* Mobile Bottom Navigation */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-50 shadow-lg">
                    {albums.map(album => {
                        const count = album === 'All Photos' ? this.state.images.length :
                            album === 'Favorites' ? favorites.size :
                                this.state.images.filter(img => img.source === 'messenger').length;

                        return (
                            <button
                                key={album}
                                onClick={() => this.setState({ currentAlbum: album })}
                                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition ${currentAlbum === album ? 'text-pink-600' : 'text-gray-600'
                                    }`}
                            >
                                <span className="text-lg">
                                    {album === 'All Photos' ? '📸' : album === 'Favorites' ? '⭐' : '💬'}
                                </span>
                                <span className="text-xs font-medium">
                                    {album === 'All Photos' ? 'All' : album === 'Favorites' ? 'Fav' : 'Chat'}
                                </span>
                            </button>
                        );
                    })}
                    <button
                        onClick={this.startSlideshow}
                        disabled={filteredImages.length === 0}
                        className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-gray-600 disabled:opacity-50"
                    >
                        <span className="text-lg">▶️</span>
                        <span className="text-xs font-medium">Play</span>
                    </button>
                </div>
            </div>
        );
    }
}

export const displayGallery = () => {
    return <Gallery />;
};

export default Gallery;
