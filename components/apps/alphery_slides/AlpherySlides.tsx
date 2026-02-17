import React, { useState, useEffect, useRef } from 'react';
import { Canvas, Textbox, Rect, Circle } from 'fabric';
import { v4 as uuidv4 } from 'uuid';

const AlpherySlides = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<Canvas | null>(null);
    const [slides, setSlides] = useState<{ id: string, thumbnail?: string }[]>([{ id: 'slide-1' }]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [status, setStatus] = useState('saved');

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const fabricCanvas = new Canvas(canvasRef.current, {
            height: 900,
            width: 1600, // 16:9 Aspect Ratio
            backgroundColor: '#ffffff',
            selection: true
        });

        // Add some default content
        const title = new Textbox('Presentation Title', {
            left: 400,
            top: 200,
            width: 800,
            fontSize: 60,
            textAlign: 'center',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#333'
        });

        const subtitle = new Textbox('Subtitle goes here', {
            left: 400,
            top: 300,
            width: 800,
            fontSize: 32,
            textAlign: 'center',
            fontFamily: 'Arial',
            fill: '#666'
        });

        fabricCanvas.add(title, subtitle);
        fabricCanvas.renderAll();

        setCanvas(fabricCanvas);

        // Auto-resize
        const resizeCanvas = () => {
            const container = document.getElementById('slide-container');
            if (container && fabricCanvas) {
                const ratio = container.clientWidth / 1600;
                fabricCanvas.setZoom(ratio);
                fabricCanvas.setDimensions({
                    width: container.clientWidth,
                    height: container.clientWidth * 0.5625
                });
            }
        };

        window.addEventListener('resize', resizeCanvas);
        // Initial resize
        setTimeout(resizeCanvas, 100);

        return () => {
            fabricCanvas.dispose();
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    // Add Object Helper
    const addText = () => {
        if (!canvas) return;
        const text = new Textbox('New Text', {
            left: 100,
            top: 100,
            fontSize: 24,
            fontFamily: 'Arial',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
    };

    const addRect = () => {
        if (!canvas) return;
        const rect = new Rect({
            left: 100,
            top: 100,
            fill: '#ff9900',
            width: 100,
            height: 100,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
    };

    const addCircle = () => {
        if (!canvas) return;
        const circle = new Circle({
            left: 150,
            top: 150,
            fill: '#ff5500',
            radius: 50,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
    };

    const addSlide = () => {
        setSlides([...slides, { id: uuidv4() }]);
        // In real implementations, save current canvas JSON to previous slide state first
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                    <img src="./themes/Yaru/apps/A-Slides.jpeg" alt="Slides" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                        <input
                            type="text"
                            defaultValue="Untitled Presentation"
                            className="text-lg font-medium bg-transparent border-none focus:ring-0 p-0"
                        />
                        <div className="text-xs text-gray-500 flex space-x-2">
                            <span className="cursor-pointer hover:text-orange-600">File</span>
                            <span className="cursor-pointer hover:text-orange-600">Edit</span>
                            <span className="cursor-pointer hover:text-orange-600">View</span>
                            <span className="cursor-pointer hover:text-orange-600">Insert</span>
                            <span className="cursor-pointer hover:text-orange-600">Slide</span>
                            <span className="cursor-pointer hover:text-orange-600">Format</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Present
                    </button>
                    <button className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-orange-600">
                        Share
                    </button>
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                        A
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
                <button onClick={addSlide} className="p-1.5 hover:bg-gray-200 rounded" title="New Slide">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={addText} className="p-1.5 hover:bg-gray-200 rounded" title="Text Box">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
                <button onClick={() => { }} className="p-1.5 hover:bg-gray-200 rounded" title="Image">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={addRect} className="p-1.5 hover:bg-gray-200 rounded" title="Rectangle">
                    <div className="w-4 h-4 border-2 border-current"></div>
                </button>
                <button onClick={addCircle} className="p-1.5 hover:bg-gray-200 rounded" title="Circle">
                    <div className="w-4 h-4 border-2 border-current rounded-full"></div>
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Thumbnails */}
                <div className="w-48 bg-gray-100 border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            onClick={() => setActiveSlide(index)}
                            className={`aspect-video bg-white shadow-sm border-2 rounded ${index === activeSlide ? 'border-orange-500' : 'border-transparent hover:border-gray-300'} flex items-center justify-center relative cursor-pointer`}
                        >
                            <span className="text-xs text-gray-400 absolute bottom-1 left-2">{index + 1}</span>
                            <div className="text-gray-300 text-xs">Slide {index + 1}</div>
                        </div>
                    ))}
                </div>

                {/* Main Canvas */}
                <div id="slide-container" className="flex-1 bg-gray-200 overflow-hidden flex items-center justify-center p-8 relative">
                    <div className="shadow-2xl">
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlpherySlides;
