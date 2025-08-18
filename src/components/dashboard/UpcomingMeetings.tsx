import React from 'react';

const meeting = {
  id: 1,
  time: '14:00',
  title: 'Atelier-Phenom'
};

export const UpcomingMeetings = () => {
  const handleMeetingClick = () => {
    // Mock behavior - open calendar event details
    console.log('Opening meeting:', meeting.title);
  };

  return (
    <section className="animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Réunions à venir
      </h3>
      
      <button
        onClick={handleMeetingClick}
        className="w-full p-4 bg-navy-card rounded-xl border border-border hover:border-gold transition-smooth animate-press text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gold font-semibold text-lg">
            {meeting.time}
          </span>
          <span className="text-foreground font-medium">
            {meeting.title}
          </span>
        </div>
      </button>
    </section>
  );
};