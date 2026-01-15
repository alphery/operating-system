import React, { Component, createRef } from 'react';

export class Camera extends Component {
    constructor() {
        super();
        this.state = {
            isStreaming: false,
            mode: 'photo', // 'photo' or 'video'
            isRecording: false,
            recordedChunks: [],
            photos: [],
            videos: [],
            selectedMedia: null,
            countdown: 0,
            flash: false,
            filter: 'none',
            facingMode: 'user',
            error: null,
            errorType: null,
            showGallery: false
        };
        this.videoRef = createRef();
        this.canvasRef = createRef();
        this.stream = null;
        this.mediaRecorder = null;
        this.countdownTimer = null;
    }

    async componentDidMount() {
        await this.startCamera();
    }

    componentWillUnmount() {
        this.stopCamera();
        if (this.countdownTimer) clearInterval(this.countdownTimer);
    }

    startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: this.state.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: this.state.mode === 'video'
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (this.videoRef.current) {
                this.videoRef.current.srcObject = this.stream;
                this.setState({ isStreaming: true, error: null });
            }
        } catch (error) {
            console.error('Camera error:', error);
            this.setState({
                error: 'Failed to access camera. Please grant camera permissions.',
                isStreaming: false
            });
        }
    }

    stopCamera = () => {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.setState({ isStreaming: false });
    }

    switchCamera = async () => {
        this.stopCamera();
        this.setState({
            facingMode: this.state.facingMode === 'user' ? 'environment' : 'user'
        }, () => {
            this.startCamera();
        });
    }

    takePhoto = () => {
        if (this.state.countdown > 0) {
            this.setState({ countdown: 3 });
            this.countdownTimer = setInterval(() => {
                this.setState(prev => {
                    if (prev.countdown <= 1) {
                        clearInterval(this.countdownTimer);
                        this.capturePhoto();
                        return { countdown: 0 };
                    }
                    return { countdown: prev.countdown - 1 };
                });
            }, 1000);
        } else {
            this.capturePhoto();
        }
    }

    capturePhoto = () => {
        const video = this.videoRef.current;
        const canvas = this.canvasRef.current;

        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        // Apply filter
        this.applyFilter(ctx);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Flash effect
        if (this.state.flash) {
            this.setState({ flash: true });
            setTimeout(() => this.setState({ flash: false }), 100);
        }

        canvas.toBlob(blob => {
            const photo = {
                id: Date.now(),
                blob: blob,
                url: URL.createObjectURL(blob),
                timestamp: new Date(),
                type: 'photo'
            };
            this.setState(prev => ({ photos: [photo, ...prev.photos] }));
        }, 'image/jpeg', 0.95);
    }

    applyFilter = (ctx) => {
        const filters = {
            'none': '',
            'grayscale': 'grayscale(100%)',
            'sepia': 'sepia(100%)',
            'vintage': 'sepia(50%) contrast(120%)',
            'cold': 'hue-rotate(180deg) saturate(120%)',
            'warm': 'hue-rotate(20deg) saturate(120%)'
        };
        if (this.videoRef.current) {
            this.videoRef.current.style.filter = filters[this.state.filter] || '';
        }
    }

    startRecording = async () => {
        try {
            const options = { mimeType: 'video/webm;codecs=vp9' };
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            const chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const video = {
                    id: Date.now(),
                    blob: blob,
                    url: URL.createObjectURL(blob),
                    timestamp: new Date(),
                    type: 'video'
                };
                this.setState(prev => ({ videos: [video, ...prev.videos] }));
            };

            this.mediaRecorder.start();
            this.setState({ isRecording: true });
        } catch (error) {
            console.error('Recording error:', error);
            alert('Failed to start recording: ' + error.message);
        }
    }

    stopRecording = () => {
        if (this.mediaRecorder && this.state.isRecording) {
            this.mediaRecorder.stop();
            this.setState({ isRecording: false });
        }
    }

    downloadMedia = (media) => {
        const a = document.createElement('a');
        a.href = media.url;
        a.download = `${media.type}_${media.id}.${media.type === 'photo' ? 'jpg' : 'webm'}`;
        a.click();
    }

    deleteMedia = (media) => {
        if (media.type === 'photo') {
            this.setState(prev => ({
                photos: prev.photos.filter(p => p.id !== media.id),
                selectedMedia: prev.selectedMedia?.id === media.id ? null : prev.selectedMedia
            }));
        } else {
            this.setState(prev => ({
                videos: prev.videos.filter(v => v.id !== media.id),
                selectedMedia: prev.selectedMedia?.id === media.id ? null : prev.selectedMedia
            }));
        }
        URL.revokeObjectURL(media.url);
    }

    render() {
        const { isStreaming, mode, isRecording, photos, videos, selectedMedia, countdown, flash, filter, error, showGallery } = this.state;

        const allMedia = [...photos, ...videos].sort((a, b) => b.timestamp - a.timestamp);

        return (
            <div className="w-full h-full flex bg-black text-white font-sans overflow-hidden">
                {/* Main Camera View */}
                {!showGallery ? (
                    <div className="flex-1 flex flex-col relative">
                        {/* Video Preview */}
                        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                            {error ? (
                                <div className="text-center p-8">
                                    <div className="text-6xl mb-4">
                                        {this.state.errorType === 'notfound' ? '🎥' : this.state.errorType === 'permission' ? '🔒' : '📷'}
                                    </div>
                                    <p className="text-red-400 text-lg mb-2 font-semibold">
                                        {this.state.errorType === 'notfound' ? 'No Camera Found' :
                                            this.state.errorType === 'permission' ? 'Camera Access Denied' :
                                                'Camera Error'}
                                    </p>
                                    <p className="text-gray-400 text-sm mb-4">{error}</p>
                                    {this.state.errorType !== 'notfound' && (
                                        <>
                                            <button
                                                onClick={this.startCamera}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                                            >
                                                Try Again
                                            </button>
                                            <p className="text-gray-500 text-xs mt-4">
                                                Click the button above or check your browser's address bar to allow camera access
                                            </p>
                                        </>
                                    )}
                                    {this.state.errorType === 'notfound' && (
                                        <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                                            <p className="text-blue-300 text-sm font-semibold mb-2">💡 How to use the Camera app:</p>
                                            <ul className="text-gray-400 text-xs text-left space-y-1 max-w-md mx-auto">
                                                <li>• Connect a webcam to your computer</li>
                                                <li>• Ensure your webcam drivers are installed</li>
                                                <li>• Check that no other app is using the camera</li>
                                                <li>• Reload this page after connecting your camera</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={this.videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    <canvas ref={this.canvasRef} className="hidden" />

                                    {/* Flash Effect */}
                                    {flash && (
                                        <div className="absolute inset-0 bg-white animate-pulse" />
                                    )}

                                    {/* Countdown */}
                                    {countdown > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-9xl font-bold animate-bounce">{countdown}</div>
                                        </div>
                                    )}

                                    {/* Recording Indicator */}
                                    {isRecording && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
                                            <div className="w-3 h-3 bg-white rounded-full" />
                                            <span className="font-semibold text-sm">REC</span>
                                        </div>
                                    )}

                                    {/* Filter Preview */}
                                    {filter !== 'none' && (
                                        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full text-xs backdrop-blur-sm capitalize">
                                            {filter}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Controls - Mobile Responsive */}
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent">
                            {/* Mode & Settings */}
                            <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-2">
                                <button
                                    onClick={() => this.setState({ mode: 'photo' })}
                                    className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition ${mode === 'photo' ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}
                                >
                                    📷 Photo
                                </button>
                                <button
                                    onClick={() => {
                                        this.setState({ mode: 'video' });
                                        this.stopCamera();
                                        setTimeout(() => this.startCamera(), 100);
                                    }}
                                    className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition ${mode === 'video' ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}
                                >
                                    🎥 Video
                                </button>
                            </div>

                            {/* Main Controls Row */}
                            <div className="flex items-center justify-between px-4 sm:px-8 pb-4 sm:pb-6">
                                {/* Left Side - Filters (Hidden on mobile) */}
                                <div className="hidden sm:flex items-center gap-2">
                                    <button
                                        onClick={this.switchCamera}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-lg"
                                        title="Switch Camera"
                                    >
                                        🔄
                                    </button>
                                </div>

                                {/* Center - Capture Button */}
                                <div className="flex-1 flex items-center justify-center">
                                    {mode === 'photo' ? (
                                        <button
                                            onClick={this.takePhoto}
                                            disabled={!isStreaming || countdown > 0}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition disabled:opacity-50 relative"
                                        >
                                            <div className="absolute inset-2 bg-white rounded-full" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={isRecording ? this.stopRecording : this.startRecording}
                                            disabled={!isStreaming}
                                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 transition disabled:opacity-50 ${isRecording ? 'border-red-600 bg-red-600' : 'border-white bg-white/20 hover:bg-white/30'}`}
                                        >
                                            <div className={`absolute inset-2 ${isRecording ? 'bg-red-600' : 'bg-red-500'} ${isRecording ? 'rounded' : 'rounded-full'}`} />
                                        </button>
                                    )}
                                </div>

                                {/* Right Side - Gallery & More */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => this.setState({ showGallery: true })}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center relative text-lg"
                                        title="Gallery"
                                    >
                                        🖼️
                                        {allMedia.length > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-xs flex items-center justify-center font-bold">
                                                {allMedia.length}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Filters Bar - Mobile Bottom Sheet */}
                            <div className="flex sm:hidden items-center gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={this.switchCamera}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition text-xs"
                                >
                                    🔄 Flip
                                </button>
                                {['none', 'grayscale', 'sepia', 'vintage', 'cold', 'warm'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => this.setState({ filter: f })}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs capitalize transition ${filter === f ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filters Bar - Desktop Side */}
                        <div className="hidden sm:flex absolute left-4 bottom-36 flex-col gap-2">
                            {['none', 'grayscale', 'sepia', 'vintage', 'cold', 'warm'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => this.setState({ filter: f })}
                                    className={`px-3 py-1.5 rounded-full text-xs capitalize backdrop-blur-sm transition ${filter === f ? 'bg-white text-black' : 'bg-black/50 hover:bg-black/70'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Gallery View */
                    <div className="flex-1 flex flex-col">
                        <div className="h-16 bg-black/90 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => this.setState({ showGallery: false, selectedMedia: null })}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                                >
                                    ←
                                </button>
                                <h2 className="text-lg font-semibold">Gallery ({allMedia.length})</h2>
                            </div>
                        </div>

                        {allMedia.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📷</div>
                                    <p className="text-gray-400">No photos or videos yet</p>
                                </div>
                            </div>
                        ) : selectedMedia ? (
                            /* Media Viewer */
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 bg-black flex items-center justify-center p-4">
                                    {selectedMedia.type === 'photo' ? (
                                        <img src={selectedMedia.url} alt="Photo" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <video src={selectedMedia.url} controls className="max-w-full max-h-full" />
                                    )}
                                </div>
                                <div className="h-20 bg-black/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => this.downloadMedia(selectedMedia)}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this ' + selectedMedia.type + '?')) {
                                                this.deleteMedia(selectedMedia);
                                            }
                                        }}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => this.setState({ selectedMedia: null })}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Grid View */
                            <div className="flex-1 overflow-auto p-6">
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {allMedia.map(media => (
                                        <div
                                            key={media.id}
                                            onClick={() => this.setState({ selectedMedia: media })}
                                            className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition relative group"
                                        >
                                            {media.type === 'photo' ? (
                                                <img src={media.url} alt="Photo" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    <video src={media.url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <div className="text-4xl">▶️</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export const displayCamera = () => {
    return <Camera />;
};

export default Camera;
