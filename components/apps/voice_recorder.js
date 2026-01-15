import React, { Component } from 'react';

export class VoiceRecorder extends Component {
    constructor() {
        super();
        this.state = {
            isRecording: false,
            isPaused: false,
            recordings: [],
            currentRecording: null,
            recordingTime: 0,
            playingId: null,
            audioLevel: 0,
            error: null,
            errorType: null
        };
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.timer = null;
        this.audioContext = null;
        this.analyser = null;
        this.stream = null;
        this.animationFrame = null;
    }

    componentWillUnmount() {
        this.stopRecording();
        if (this.timer) clearInterval(this.timer);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    startRecording = async () => {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup audio analyzer for visualization
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 256;

            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const recording = {
                    id: Date.now(),
                    blob: audioBlob,
                    url: audioUrl,
                    duration: this.state.recordingTime,
                    timestamp: new Date(),
                    name: `Recording ${this.state.recordings.length + 1}`
                };

                this.setState(prev => ({
                    recordings: [recording, ...prev.recordings],
                    currentRecording: null,
                    recordingTime: 0,
                    isRecording: false,
                    isPaused: false
                }));
            };

            this.mediaRecorder.start();
            this.setState({ isRecording: true, isPaused: false, error: null });

            // Start timer
            this.timer = setInterval(() => {
                if (!this.state.isPaused) {
                    this.setState(prev => ({ recordingTime: prev.recordingTime + 1 }));
                }
            }, 1000);

            // Start audio level visualization
            this.visualize();

        } catch (error) {
            console.error('Recording error:', error);
            this.setState({
                error: 'Failed to access microphone. Please grant microphone permissions.',
                isRecording: false
            });
        }
    }

    visualize = () => {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
            this.analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / bufferLength);
            const level = Math.min(100, rms * 300);

            this.setState({ audioLevel: level });

            if (this.state.isRecording) {
                this.animationFrame = requestAnimationFrame(updateLevel);
            }
        };

        updateLevel();
    }

    pauseRecording = () => {
        if (this.mediaRecorder && this.state.isRecording) {
            if (this.state.isPaused) {
                this.mediaRecorder.resume();
                this.setState({ isPaused: false });
            } else {
                this.mediaRecorder.pause();
                this.setState({ isPaused: true });
            }
        }
    }

    stopRecording = () => {
        if (this.mediaRecorder && this.state.isRecording) {
            this.mediaRecorder.stop();
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        }
    }

    playRecording = (recording) => {
        const audio = new Audio(recording.url);
        audio.play();
        this.setState({ playingId: recording.id });

        audio.onended = () => {
            this.setState({ playingId: null });
        };
    }

    downloadRecording = (recording) => {
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `${recording.name.replace(/\s+/g, '_')}.webm`;
        a.click();
    }

    deleteRecording = (recording) => {
        if (confirm(`Delete "${recording.name}"?`)) {
            URL.revokeObjectURL(recording.url);
            this.setState(prev => ({
                recordings: prev.recordings.filter(r => r.id !== recording.id)
            }));
        }
    }

    renameRecording = (recording) => {
        const newName = prompt('Enter new name:', recording.name);
        if (newName && newName.trim()) {
            this.setState(prev => ({
                recordings: prev.recordings.map(r =>
                    r.id === recording.id ? { ...r, name: newName.trim() } : r
                )
            }));
        }
    }

    formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    render() {
        const { isRecording, isPaused, recordings, recordingTime, playingId, audioLevel, error } = this.state;

        return (
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900 font-sans overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">🎤</div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-900">Voice Recorder</h1>
                            <p className="text-xs text-gray-500">{recordings.length} recordings</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Recording Controls */}
                    <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 border border-gray-200">
                            {error ? (
                                <div className="text-center py-8 sm:py-12">
                                    <div className="text-6xl mb-4">
                                        {this.state.errorType === 'notfound' ? '🎤' : this.state.errorType === 'permission' ? '🔒' : '🚫'}
                                    </div>
                                    <p className="text-red-600 font-semibold mb-2 text-lg">
                                        {this.state.errorType === 'notfound' ? 'No Microphone Found' :
                                            this.state.errorType === 'permission' ? 'Microphone Access Denied' :
                                                'Microphone Error'}
                                    </p>
                                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                                    {this.state.errorType !== 'notfound' && (
                                        <>
                                            <button
                                                onClick={this.startRecording}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                                            >
                                                Try Again
                                            </button>
                                            <p className="text-gray-500 text-xs mt-4">
                                                Click the button above or check your browser's address bar to allow microphone access
                                            </p>
                                        </>
                                    )}
                                    {this.state.errorType === 'notfound' && (
                                        <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-300">
                                            <p className="text-purple-700 text-sm font-semibold mb-2">💡 How to use the Voice Recorder:</p>
                                            <ul className="text-gray-700 text-xs text-left space-y-1 max-w-md mx-auto">
                                                <li>• Connect a microphone to your computer</li>
                                                <li>• Check that your microphone is enabled in system settings</li>
                                                <li>• Ensure no other app is using the microphone</li>
                                                <li>• Try using headphones with a built-in mic</li>
                                                <li>• Reload this page after connecting your microphone</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Recording Visualizer */}
                                    <div className="mb-8">
                                        {isRecording ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-center items-center gap-1">
                                                    {[...Array(20)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 rounded-full transition-all duration-100 ${isPaused ? 'bg-gray-300' : 'bg-gradient-to-t from-purple-600 to-blue-600'
                                                                }`}
                                                            style={{
                                                                height: `${Math.max(8, (Math.random() * audioLevel * 2))}px`
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-5xl font-bold font-mono text-gray-900 mb-2">
                                                        {this.formatTime(recordingTime)}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {isPaused ? 'Paused' : 'Recording...'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="text-7xl mb-4">🎙️</div>
                                                <p className="text-gray-500">Ready to record</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Control Buttons */}
                                    <div className="flex items-center justify-center gap-4">
                                        {!isRecording ? (
                                            <button
                                                onClick={this.startRecording}
                                                className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center"
                                            >
                                                <div className="text-3xl">●</div>
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={this.pauseRecording}
                                                    className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition flex items-center justify-center"
                                                >
                                                    {isPaused ? '▶' : '⏸'}
                                                </button>
                                                <button
                                                    onClick={this.stopRecording}
                                                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center"
                                                >
                                                    <div className="w-6 h-6 bg-white rounded-sm" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recordings List */}
                    {recordings.length > 0 && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Recordings</h2>
                            <div className="space-y-3">
                                {recordings.map(recording => (
                                    <div
                                        key={recording.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    onClick={() => this.playRecording(recording)}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${playingId === recording.id
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                                        }`}
                                                >
                                                    {playingId === recording.id ? '⏸' : '▶'}
                                                </button>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{recording.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {this.formatTime(recording.duration)} • {this.formatDate(recording.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => this.renameRecording(recording)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Rename"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => this.downloadRecording(recording)}
                                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Download"
                                                >
                                                    ⬇️
                                                </button>
                                                <button
                                                    onClick={() => this.deleteRecording(recording)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {recordings.length === 0 && !isRecording && !error && (
                        <div className="max-w-2xl mx-auto text-center py-12">
                            <div className="text-6xl mb-4">🎵</div>
                            <p className="text-gray-500">No recordings yet. Click the record button to start!</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export const displayVoiceRecorder = () => {
    return <VoiceRecorder />;
};

export default VoiceRecorder;
