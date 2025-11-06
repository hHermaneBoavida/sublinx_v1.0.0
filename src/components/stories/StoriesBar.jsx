import React from 'react';
import { motion } from 'framer-motion';

const StoryAvatar = ({ user, onClick }) => (
  <motion.div
    className="flex flex-col items-center space-y-1 cursor-pointer"
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="relative">
      <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500">
        <div className="bg-black p-0.5 rounded-full">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
    </div>
    <p className="text-xs text-gray-300 truncate w-16 text-center">{user.name}</p>
  </motion.div>
);

export default function StoriesBar({ storyGroups, onStoryClick }) {
  if (!storyGroups || storyGroups.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {storyGroups.map((group) => (
          <StoryAvatar
            key={group.userId}
            user={{ name: group.userName, avatarUrl: group.userAvatarUrl }}
            onClick={() => onStoryClick(group)}
          />
        ))}
      </div>
    </div>
  );
}