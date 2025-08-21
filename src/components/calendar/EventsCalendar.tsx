import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents, type Event, type EventsFilters, type UpdateEventData, type CreateEventData } from '@/hooks/useEvents';
import EventDetailsModal from '@/components/dashboard/EventDetailsModal';
import { EventModal } from '@/components/dashboard/EventModal';

type CalendarView = 'month' | 'week' | 'list';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day === 0 ? -6 : 1 - day); // Monday as first day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toISODateString(d: Date): string {
  return new Date(d).toISOString();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function groupEventsByDay(events: Event[]): Record<string, Event[]> {
  return events.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = new Date(ev.starts_at).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function capitalizeFirst(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function formatWeekdayDayMonth(date: Date): string {
  const weekday = capitalizeFirst(date.toLocaleDateString(undefined, { weekday: 'long' }));
  const dayMonth = date.toLocaleDateString(undefined, { day: '2-digit', month: 'long' });
  return `${weekday} ${dayMonth}`;
}

function formatMonthYearTitle(date: Date): string {
  const txt = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export const EventsCalendar: React.FC = () => {
  const [view, setView] = React.useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);

  const range = React.useMemo(() => {
    if (view === 'week') {
      return { from: startOfWeek(currentDate), to: endOfWeek(currentDate) };
    }
    if (view === 'list') {
      // 30 jours glissants
      const from = new Date(currentDate);
      from.setDate(from.getDate() - 15);
      from.setHours(0, 0, 0, 0);
      const to = new Date(currentDate);
      to.setDate(to.getDate() + 15);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
  }, [view, currentDate]);

  const monthParam = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  // ISO week number
  const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const filters = React.useMemo(() => {
    if (view === 'week') {
      return { week: getISOWeek(currentDate) } as const;
    }
    if (view === 'month') {
      // Récupérer aussi les mois adjacents
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const prevMonthDate = new Date(year, month - 1, 1);
      const nextMonthDate = new Date(year, month + 1, 1);
      const from = startOfMonth(prevMonthDate);
      const to = endOfMonth(nextMonthDate);
      return { date_from: toISODateString(from), date_to: toISODateString(to) } as const;
    }
    return { date_from: toISODateString(range.from), date_to: toISODateString(range.to) } as const;
  }, [view, currentDate, range.from, range.to]);

  const { events, isLoading, error, deleteEvent, updateEvent } = useEvents(filters as EventsFilters);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteSelected = async () => {
    if (!selectedEvent) return;
    try {
      setIsDeleting(true);
      await deleteEvent.mutateAsync(selectedEvent.id);
      setSelectedEvent(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'list') d.setDate(d.getDate() - 30);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'list') d.setDate(d.getDate() + 30);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const renderWeekGrid = () => {
    const start = startOfWeek(currentDate);
    const days: Date[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayKey = day.toISOString().slice(0, 10);
          const dayEvents = sortedEvents.filter((ev) => new Date(ev.starts_at).toISOString().slice(0,10) === dayKey);
          return (
            <div key={dayKey} className="rounded-lg border border-border p-3 bg-card">
              <div className="text-sm font-medium mb-2">{formatWeekdayDayMonth(day)}</div>
              <div className="space-y-2">
                {dayEvents.length === 0 && (
                  <div className="text-sm text-muted-foreground">Aucun événement</div>
                )}
                {dayEvents.map((ev) => {
                  const start = new Date(ev.starts_at);
                  const end = new Date(ev.ends_at);
                  return (
                    <div key={ev.id} className="text-sm rounded-md bg-primary/10 p-2 relative group hover:bg-primary/15 cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(start)} - {formatTime(end)} {ev.location ? `· ${ev.location}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    const d = new Date(gridStart);
    while (d <= gridEnd) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const monthIndex = currentDate.getMonth();

    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-7 border-b text-xs text-muted-foreground">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((label) => (
            <div key={label} className="px-2 py-2 border-r last:border-r-0">{label}</div>
          ))}
        </div>
        <div className="divide-y">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-1 md:grid-cols-7">
              {week.map((day) => {
                const isCurrentMonth = day.getMonth() === monthIndex;
                const dayKey = localDateKey(day);
                const dayEvents = sortedEvents.filter((ev) => localDateKey(new Date(ev.starts_at)) === dayKey);
                const isToday = localDateKey(new Date()) === dayKey;
                return (
                  <div key={dayKey} className={`min-h-[120px] p-2 border-r last:border-r-0 ${isCurrentMonth ? '' : 'bg-muted/20'} ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-medium ${isCurrentMonth ? '' : 'text-muted-foreground'}`}>{day.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.length === 0 && (
                        <div className="text-xs text-muted-foreground">Aucun événement</div>
                      )}
                      {dayEvents.map((ev) => {
                        const start = new Date(ev.starts_at);
                        const end = new Date(ev.ends_at);
                        return (
                          <div key={ev.id} className="text-xs rounded bg-primary/10 px-2 py-1 relative group hover:bg-primary/15 cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                            <div className="font-semibold truncate" title={ev.title}>{ev.title}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatTime(start)} - {formatTime(end)} {ev.location ? `· ${ev.location}` : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderList = () => {
    const byDay = groupEventsByDay(sortedEvents);
    const dayKeys = Object.keys(byDay).sort();
    return (
      <div className="space-y-4">
        {dayKeys.length === 0 && (
          <div className="text-sm text-muted-foreground">Aucun événement à afficher.</div>
        )}
        {dayKeys.map((key) => {
          const day = new Date(key);
          return (
            <div key={key} className="rounded-lg border border-border bg-card">
              <div className="px-4 py-2 border-b text-sm font-medium">{formatDate(day)}</div>
              <div className="divide-y">
                {byDay[key].map((ev) => {
                  const start = new Date(ev.starts_at);
                  const end = new Date(ev.ends_at);
                  return (
                    <div key={ev.id} className="px-4 py-3 relative group hover:bg-primary/10 cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(start)} - {formatTime(end)} {ev.location ? `· ${ev.location}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} aria-label="Précédent" title="Précédent" className="px-3 py-1 rounded-md border border-border hover:bg-accent text-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1 rounded-md border border-border hover:bg-accent text-sm">Aujourd'hui</button>
          <button onClick={goNext} aria-label="Suivant" title="Suivant" className="px-3 py-1 rounded-md border border-border hover:bg-accent text-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded-md border text-sm ${view==='month' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}>Mois</button>
          <button onClick={() => setView('week')} className={`px-3 py-1 rounded-md border text-sm ${view==='week' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}>Semaine</button>
          <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md border text-sm ${view==='list' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}>Liste</button>
        </div>
      </div>

      {/* Titre de période */}
      <div className="text-base font-semibold">
        {view === 'month' && formatMonthYearTitle(currentDate)}
        {view === 'week' && (() => {
          const s = startOfWeek(currentDate);
          const e = endOfWeek(currentDate);
          const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
          return `${fmt(s)} — ${fmt(e)}`;
        })()}
        {view === 'list' && (() => {
          const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
          return `${fmt(range.from)} — ${fmt(range.to)}`;
        })()}
      </div>

      {error && (
        <div className="text-sm text-red-400">Erreur lors du chargement des événements.</div>
      )}
      {isLoading && (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {view === 'month' && renderMonthGrid()}

          {view === 'week' && renderWeekGrid()}
          {view === 'list' && renderList()}
        </div>
      )}

      {/* Modale de détails avec suppression uniquement depuis le calendrier */}
      <EventDetailsModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        showDelete={true}
        showEdit={true}
        onEdit={() => {
          setEditingEvent(selectedEvent);
          setSelectedEvent(null);
        }}
        onDelete={handleDeleteSelected}
        deleteLoading={isDeleting}
      />


      <EventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onSubmit={async (data) => {
          await updateEvent.mutateAsync(data as UpdateEventData);
          setEditingEvent(null);
        }}
        isLoading={updateEvent?.isPending ?? false}
      />
    </div>
  );
};

export default EventsCalendar;


