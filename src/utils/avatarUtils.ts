/**
 * Avatar utilities for generating dummy avatar roles during onboarding
 */

export const generateAvatarRole = (userRole: 'consumer' | 'doctor', userId: string): string => {
  // Generate a consistent avatar role based on user ID
  const seed = userId || 'default';
  const imageIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10;

  if (userRole === 'doctor') {
    return `doctor_${imageIndex}`;
  } else {
    return `consumer_${imageIndex}`;
  }
};

export const getAvatarImageCount = (role: 'consumer' | 'doctor'): number => {
  // Return the number of available avatar images for each role
  return 10; // We have 10 images for each role
};

export const previewAvatarImage = (role: 'consumer' | 'doctor', avatarRole: string): string => {
  // Generate preview URL for avatar selection during onboarding
  const imageIndex = parseInt(avatarRole.split('_')[1]) || 0;

  if (role === 'doctor') {
    const doctorImages = [
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1563902690319-d0b65ba4df47?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=300&h=300&fit=crop&crop=face',

      // Additional 40 doctor avatars
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1590086782792-42dd1d5c46e4?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573495628367-3f45f75f9d89?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',

      // (Add more if needed, similar pattern)
    ];
    return doctorImages[imageIndex % doctorImages.length];
  } else {
    const consumerImages = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616c2e9ba83?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1557862921-37829c790f19?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',

      // Additional 40 consumer avatars
      'https://images.unsplash.com/photo-1590086782792-42dd1d5c46e4?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1606721977762-10e49a1a6b6b?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573495628367-3f45f75f9d89?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616c2e9ba83?w=300&h=300&fit=crop&crop=face',

      // (Add more if needed)
    ];
    return consumerImages[imageIndex % consumerImages.length];
  }
};