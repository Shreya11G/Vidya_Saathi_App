import { useEffect, useState } from 'react';
import api from '../api/api';

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let objectUrl;

    if (!user?.profilePhoto) {
      setPhotoUrl(null);
      return undefined;
    }

    (async () => {
      try {
        const response = await api.get('/auth/profile-photo', { responseType: 'blob' });
        objectUrl = URL.createObjectURL(response.data);
        setPhotoUrl(objectUrl);
      } catch {
        setPhotoUrl(null);
      }
    })();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.profilePhoto, user?._id]);

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={user?.name || 'Profile'}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeClass} ${className}`}
    >
      {getInitials(user?.name)}
    </div>
  );
};

export default UserAvatar;
