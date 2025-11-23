
import React from 'react';
import Avatar from 'react-nice-avatar';
import { User } from '../types';

interface AvatarDisplayProps {
    user?: User; // Pass full user object if available
    avatarUrl?: string; // Or pass individual props
    avatarConfig?: any;
    className?: string;
    size?: string | number; // For react-nice-avatar
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ user, avatarUrl, avatarConfig, className, size = "100%" }) => {
    const config = user ? user.avatarConfig : avatarConfig;
    const url = user ? user.avatarUrl : avatarUrl;

    if (config) {
        return (
            <div className={`overflow-hidden ${className}`}>
                 <Avatar style={{ width: '100%', height: '100%' }} {...config} />
            </div>
        );
    }

    // Fallback to image URL
    return (
        <img 
            src={url || `https://api.dicebear.com/9.x/avataaars/svg?seed=fallback`} 
            alt="Avatar" 
            className={`object-cover ${className}`} 
        />
    );
};

export default AvatarDisplay;
