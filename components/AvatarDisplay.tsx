
import React from 'react';
import { User } from '../types';

interface AvatarDisplayProps {
    user?: User;
    className?: string;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ user, className }) => {
    // If no user provided
    if (!user) return <div className={`bg-gray-200 ${className}`}></div>;

    // 1. Show Photo if available
    if (user.avatarUrl && user.avatarUrl.length > 0) {
        return (
            <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className={`object-cover w-full h-full ${className}`} 
            />
        );
    }

    // 2. Show Initials (Fallback)
    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    // Generate a consistent pastel color based on name
    const colors = [
        'bg-blue-200 text-blue-700',
        'bg-green-200 text-green-700',
        'bg-yellow-200 text-yellow-700',
        'bg-purple-200 text-purple-700',
        'bg-pink-200 text-pink-700',
        'bg-indigo-200 text-indigo-700',
    ];
    
    let hash = 0;
    for (let i = 0; i < user.name.length; i++) {
        hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];

    return (
        <div className={`w-full h-full flex items-center justify-center font-bold text-xl font-display ${colorClass} ${className}`}>
            {initials}
        </div>
    );
};

export default AvatarDisplay;
