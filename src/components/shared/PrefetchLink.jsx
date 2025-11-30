import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchEventDetails, prefetchUserProfile } from "./optimizations";

export function PrefetchEventLink({ eventId, children, ...props }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    if (eventId) {
      prefetchEventDetails(queryClient, eventId);
    }
  };

  return (
    <Link onMouseEnter={handleMouseEnter} onTouchStart={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}

export function PrefetchUserLink({ userId, children, ...props }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    if (userId) {
      prefetchUserProfile(queryClient, userId);
    }
  };

  return (
    <Link onMouseEnter={handleMouseEnter} onTouchStart={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}