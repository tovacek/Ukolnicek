
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelected: (base64: string | null) => void;
    initialImage?: string | null;
    label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, initialImage, label = "Fotka" }) => {
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        setImage(initialImage || null);
    }, [initialImage]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error(err);
            alert("Nelze spustit kameru. Zkontrolujte oprávnění prohlížeče.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                setImage(base64);
                onImageSelected(base64);
                stopCamera();
            }
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                setImage(res);
                onImageSelected(res);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setImage(null);
        onImageSelected(null);
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}

            {isCameraOpen ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute bottom-4 flex gap-6 items-center z-10">
                        <button type="button" onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                            <X size={24} />
                        </button>
                        <button type="button" onClick={takePhoto} className="p-1 bg-white rounded-full border-4 border-white/30 shadow-lg active:scale-95 transition-transform">
                            <div className="w-14 h-14 bg-red-500 rounded-full border-2 border-white"></div>
                        </button>
                    </div>
                </div>
            ) : image ? (
                 <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-brand-green bg-green-50 shadow-sm group">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    <button type="button" onClick={clearImage} className="absolute top-2 right-2 p-2 bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-brand-blue transition-colors gap-2 text-gray-500 hover:text-brand-blue h-32"
                    >
                        <div className="p-3 bg-blue-50 rounded-full text-brand-blue mb-1">
                            <Camera size={24} />
                        </div>
                        <span className="font-bold text-sm">Vyfotit</span>
                    </button>

                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-green-50 hover:border-brand-green transition-colors gap-2 text-gray-500 hover:text-brand-green cursor-pointer h-32 relative">
                        <div className="p-3 bg-green-50 rounded-full text-brand-green mb-1">
                             <ImageIcon size={24} />
                        </div>
                        <span className="font-bold text-sm">Galerie</span>
                        <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
