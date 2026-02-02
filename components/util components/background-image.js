import React from 'react'
import Image from 'next/image'

export default function BackgroundImage(props) {
    const bg_images = {
        "wall-1": "/images/wallpapers/wallpaper1.jpg",
        "wall-2": "/images/wallpapers/wallpaper2.jpg",
        "wall-4": "/images/wallpapers/wallpaper4.jpg",
        "wall-5": "/images/wallpapers/wallpaper5.jpg",
        "wall-7": "/images/wallpapers/wallpaper7.jpg",
        "wall-8": "/images/wallpapers/wallpaper8.jpg",
    };

    // If image not found in map, use default
    const imgSrc = bg_images[props.img] || bg_images["wall-8"];

    return (
        <div className="absolute -z-10 top-0 right-0 overflow-hidden h-full w-full">
            <Image
                src={imgSrc}
                alt="Desktop Wallpaper"
                fill
                priority={true} // Priority loading for LCP boost
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                className="bg-ubuntu-img"
                draggable={false}
                quality={85} // Good balance of quality/size
            />
        </div>
    )
}
