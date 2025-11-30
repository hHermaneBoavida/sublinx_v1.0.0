import React from "react";
import EventFeedCard from "./EventFeedCard";

// Memoized wrapper to prevent unnecessary re-renders
const MemoizedEventCard = React.memo(
  EventFeedCard,
  (prevProps, nextProps) => {
    // Custom comparison for shallow equality
    return (
      prevProps.event.id === nextProps.event.id &&
      prevProps.initialLikes?.length === nextProps.initialLikes?.length &&
      prevProps.initialComments?.length === nextProps.initialComments?.length &&
      prevProps.initialRequestStatus === nextProps.initialRequestStatus &&
      prevProps.user?.id === nextProps.user?.id &&
      prevProps.organizer?.id === nextProps.organizer?.id
    );
  }
);

MemoizedEventCard.displayName = 'MemoizedEventCard';

export default MemoizedEventCard;