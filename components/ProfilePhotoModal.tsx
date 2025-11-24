
import React, { useState } from 'react';
import { X, Save, Camera } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { User } from '../types';

interface ProfilePhotoModalProps {
    user: User;
    onSave: (newUrl: string) => void;
    onClose: () => void;
}

const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ user, onSave, onClose }) => {
    const [image, setImage] = useState<string | null>(user.avatarUrl || null);

    const handleSave = () => {
        onSave(image || '');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Camera className="text-brand-blue"/> Profilová fotka
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-400"/>
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-4">Vyber si fotku z galerie nebo se vyfoť!</p>
                    <ImageUploader 
                        onImageSelected={setImage} 
                        initialImage={image}
                        label=""
                    />
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={20}/> Uložit fotku
                </button>
            </div>
        </div>
    );
};

export default ProfilePhotoModal;
