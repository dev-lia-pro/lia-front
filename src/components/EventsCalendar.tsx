import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents, type Event, type EventsFilters, type UpdateEventData, type CreateEventData } from '@/hooks/useEvents';
import { useProjectStore } from '@/stores/projectStore';
import EventDetailsModal from '@/components/EventDetailsModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { getIconByValue } from '@/config/icons';
import { EventModal } from '@/components/EventModal';
import { useSearchParams } from 'react-router-dom';

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

function formatHourShort(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
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

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
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

// Helper functions for date serialization
function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stringToDate(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const EventsCalendar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL or defaults
  const viewFromUrl = searchParams.get('view') as CalendarView | null;
  const dateFromUrl = searchParams.get('date');

  const [view, setViewState] = React.useState<CalendarView>(viewFromUrl || 'month');
  const [currentDate, setCurrentDateState] = React.useState<Date>(() => {
    return dateFromUrl ? stringToDate(dateFromUrl) : new Date();
  });

  // Update URL when state changes
  React.useEffect(() => {
    setSearchParams({
      view: view,
      date: dateToString(currentDate)
    }, { replace: true });
  }, [view, currentDate, setSearchParams]);

  // Wrapper functions to update state
  const setView = (newView: CalendarView) => {
    setViewState(newView);
  };

  const setCurrentDate = (newDate: Date) => {
    setCurrentDateState(newDate);
  };

  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState<boolean>(false);
  const [createStartDate, setCreateStartDate] = React.useState<Date | null>(null);
  const [hoveredDayKey, setHoveredDayKey] = React.useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = React.useState<number | null>(null);
  const [dragOverDayKey, setDragOverDayKey] = React.useState<string | null>(null);

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

  const { selected } = useProjectStore();
  const filters = React.useMemo(() => {
    if (view === 'week') {
      return { week: getISOWeek(currentDate), project: selected.id ?? undefined } as const;
    }
    if (view === 'month') {
      // Récupérer aussi les mois adjacents
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const prevMonthDate = new Date(year, month - 1, 1);
      const nextMonthDate = new Date(year, month + 1, 1);
      const from = startOfMonth(prevMonthDate);
      const to = endOfMonth(nextMonthDate);
      return { date_from: toISODateString(from), date_to: toISODateString(to), project: selected.id ?? undefined } as const;
    }
    return { date_from: toISODateString(range.from), date_to: toISODateString(range.to), project: selected.id ?? undefined } as const;
  }, [view, currentDate, range.from, range.to, selected.id]);

  const { events, isLoading, error, deleteEvent, updateEvent, createEvent } = useEvents(filters as EventsFilters);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { projects } = useProjects();

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
    setCurrentDate(new Date(d)); // Create new Date instance
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'list') d.setDate(d.getDate() + 30);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(new Date(d)); // Create new Date instance
  };

  const goToday = () => setCurrentDate(new Date());

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const handleAssignEventProject = async (eventId: number, projectId: number | '') => {
    try {
      await updateEvent.mutateAsync({ id: eventId, project: projectId === '' ? null : (projectId as number) } as UpdateEventData);
    } catch (e) {
      // silencieux
    }
  };

  // Drag & Drop pour déplacer les événements
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, event: Event) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      id: event.id, 
      starts_at: event.starts_at, 
      ends_at: event.ends_at 
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDayKey(dayKey);
  };

  const handleDragLeave = () => {
    setDragOverDayKey(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetDayKey: string) => {
    e.preventDefault();
    setDragOverDayKey(null);
    
    try {
      const payload = e.dataTransfer.getData('application/json');
      if (!payload) return;
      
      const { id, starts_at, ends_at } = JSON.parse(payload) as { 
        id: number; 
        starts_at: string; 
        ends_at: string; 
      };
      
      // Calculer la différence de jours entre la source et la cible
      const sourceDate = new Date(starts_at);
      const targetDate = new Date(targetDayKey + 'T00:00:00'); // Forcer l'heure à minuit
      
      // Calculer la différence en jours en utilisant la date locale
      const sourceLocal = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate());
      const targetLocal = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const dayDiff = (targetLocal.getTime() - sourceLocal.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 0) return; // Même jour, pas de changement
      
      // Calculer les nouvelles dates en préservant l'heure locale
      const newStartsAt = new Date(sourceDate);
      newStartsAt.setDate(sourceDate.getDate() + dayDiff);
      
      const newEndsAt = new Date(ends_at);
      newEndsAt.setDate(newEndsAt.getDate() + dayDiff);
      
      // Mettre à jour l'événement
      await updateEvent.mutateAsync({
        id,
        starts_at: newStartsAt.toISOString(),
        ends_at: newEndsAt.toISOString()
      } as UpdateEventData);
      
    } catch (error) {
      console.error('Erreur lors du déplacement de l\'événement:', error);
    }
  };

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
          const dayKey = localDateKey(day);
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayEvents = sortedEvents.filter((ev) => {
            if (ev.is_all_day) {
              // Le backend envoie maintenant les dates dans le timezone de l'utilisateur
              const eventStart = new Date(ev.starts_at);
              const eventEnd = new Date(ev.ends_at);

              // Extraire juste la partie date (sans l'heure)
              const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
              const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

              const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

              // L'événement apparaît sur tous les jours entre startDate et endDate (inclus)
              return currentDay >= startDate && currentDay <= endDate;
            } else {
              const s = new Date(ev.starts_at);
              const e = new Date(ev.ends_at);
              return e >= dayStart && s <= dayEnd;
            }
          });
          const isDayHoverActive = hoveredDayKey === dayKey && hoveredEventId === null;
          return (
            <div
              key={dayKey}
              className={`rounded-lg border border-border p-3 bg-card transition-colors cursor-pointer ${isDayHoverActive ? 'bg-primary/10' : ''} ${dragOverDayKey === dayKey ? 'ring-2 ring-gold bg-gold/10' : ''}`}
              onClick={() => { setCreateStartDate(day); setIsCreateOpen(true); }}
              onMouseEnter={() => setHoveredDayKey(dayKey)}
              onMouseLeave={() => setHoveredDayKey((prev) => (prev === dayKey ? null : prev))}
              onDragOver={(e) => handleDragOver(e, dayKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dayKey)}
            >
              <div className="text-sm font-medium mb-2">{formatWeekdayDayMonth(day)}</div>
              <div className="space-y-2">
                {dayEvents.length === 0 && (
                  <div className="text-sm text-muted-foreground">Aucun événement</div>
                )}
                {dayEvents.map((ev) => {
                  const start = new Date(ev.starts_at);
                  const end = new Date(ev.ends_at);
                  const isMultiDay = localDateKey(start) !== localDateKey(end);
                  const isFirstDay = localDateKey(start) === localDateKey(day);
                  const isLastDay = localDateKey(end) === localDateKey(day);
                  return (
                    <div
                      key={ev.id}
                      className="text-sm rounded-md bg-primary/10 p-2 relative group hover:bg-primary/15 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      onMouseEnter={() => setHoveredEventId(ev.id)}
                      onMouseLeave={() => setHoveredEventId((prev) => (prev === ev.id ? null : prev))}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                    >
                      {!selected.id && (
                        <div className="absolute top-1 right-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="px-1.5 py-0.5 rounded bg-muted/10 border border-border text-[10px] hover:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                                {ev.project ? (
                                  <>
                                    {(() => {
                                      const IconComponent = getIconByValue((projects.find(p => p.id === ev.project)?.icon) || '');
                                      return IconComponent ? <span className="mr-1 inline-block"><IconComponent className="w-3 h-3" /></span> : null;
                                    })()}
                                    <span className="truncate max-w-[90px] align-middle">{projects.find(p => p.id === ev.project)?.title || `Projet #${ev.project}`}</span>
                                  </>
                                ) : (
                                  <span className="text-foreground/60">Aucun</span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-navy-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleAssignEventProject(ev.id, '')} className="cursor-pointer hover:bg-navy-muted">Aucun projet</DropdownMenuItem>
                              {projects.map((p) => {
                                const IconComponent = getIconByValue(p.icon);
                                return (
                                  <DropdownMenuItem key={p.id} onClick={() => handleAssignEventProject(ev.id, p.id)} className="cursor-pointer hover:bg-navy-muted">
                                    <span className="mr-2">{IconComponent ? <IconComponent className="w-4 h-4" /> : null}</span>
                                    <span>{p.title}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {ev.is_all_day ? (
                          <>Toute la journée {ev.location ? <>· {ev.location}</> : null}</>
                        ) : isMultiDay ? (
                          isFirstDay ? (
                            <>À {formatHourShort(start)} {ev.location ? <>· {ev.location}</> : null}</>
                          ) : isLastDay ? (
                            <>Jusqu'à {formatHourShort(end)} {ev.location ? <>· {ev.location}</> : null}</>
                          ) : (
                            <>{ev.location ? ev.location : ''}</>
                          )
                        ) : (
                          <>
                            {formatTime(start)} - {formatTime(end)} {ev.location ? <>· {ev.location}</> : null}
                          </>
                        )}
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
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const dayEvents = sortedEvents.filter((ev) => {
                  if (ev.is_all_day) {
                    // Le backend envoie maintenant les dates dans le timezone de l'utilisateur
                    const eventStart = new Date(ev.starts_at);
                    const eventEnd = new Date(ev.ends_at);

                    // Extraire juste la partie date (sans l'heure)
                    const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                    const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

                    const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

                    // L'événement apparaît sur tous les jours entre startDate et endDate (inclus)
                    return currentDay >= startDate && currentDay <= endDate;
                  } else {
                    const s = new Date(ev.starts_at);
                    const e = new Date(ev.ends_at);
                    return e >= dayStart && s <= dayEnd;
                  }
                });
                const isToday = localDateKey(new Date()) === dayKey;
                const isDayHoverActive = hoveredDayKey === dayKey && hoveredEventId === null;
                return (
                  <div
                    key={dayKey}
                    className={`min-h-[120px] p-2 border-r last:border-r-0 ${isCurrentMonth ? '' : 'bg-muted/20'} ${isToday ? 'bg-primary/5' : ''} transition-colors cursor-pointer ${isDayHoverActive ? 'bg-primary/10' : ''} ${dragOverDayKey === dayKey ? 'ring-2 ring-gold bg-gold/10' : ''}`}
                    onClick={() => { setCreateStartDate(day); setIsCreateOpen(true); }}
                    onMouseEnter={() => setHoveredDayKey(dayKey)}
                    onMouseLeave={() => setHoveredDayKey((prev) => (prev === dayKey ? null : prev))}
                    onDragOver={(e) => handleDragOver(e, dayKey)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayKey)}
                  >
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
                        const isMultiDay = localDateKey(start) !== localDateKey(end);
                        const isFirstDay = localDateKey(start) === dayKey;
                        const isLastDay = localDateKey(end) === dayKey;
                        return (
                          <div
                            key={ev.id}
                            className="text-xs rounded bg-primary/10 px-2 py-1 relative group hover:bg-primary/15 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            onMouseEnter={() => setHoveredEventId(ev.id)}
                            onMouseLeave={() => setHoveredEventId((prev) => (prev === ev.id ? null : prev))}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                          >
                            {!selected.id && (
                              <div className="absolute top-1 right-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="px-1.5 py-0.5 rounded bg-muted/10 border border-border text-[10px] hover:bg-muted/20" onClick={(e) => e.stopPropagation()}>
                                      {ev.project ? (
                                        <>
                                          {(() => {
                                            const IconComponent = getIconByValue((projects.find(p => p.id === ev.project)?.icon) || '');
                                            return IconComponent ? <span className="mr-1 inline-block"><IconComponent className="w-3 h-3" /></span> : null;
                                          })()}
                                          <span className="truncate max-w-[80px] align-middle">{projects.find(p => p.id === ev.project)?.title || `Projet #${ev.project}`}</span>
                                        </>
                                      ) : (
                                        <span className="text-foreground/60">Aucun</span>
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-navy-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handleAssignEventProject(ev.id, '')} className="cursor-pointer hover:bg-navy-muted">Aucun projet</DropdownMenuItem>
                                    {projects.map((p) => (
                                      <DropdownMenuItem key={p.id} onClick={() => handleAssignEventProject(ev.id, p.id)} className="cursor-pointer hover:bg-navy-muted">
                                        <span className="mr-2">{getIconByValue(p.icon)}</span>
                                        <span>{p.title}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                            <div className="font-semibold truncate" title={ev.title}>{ev.title}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {ev.is_all_day ? (
                                <>Toute la journée {ev.location ? <>· {ev.location}</> : null}</>
                              ) : isMultiDay ? (
                                isFirstDay ? (
                                  <>À {formatHourShort(start)} {ev.location ? <>· {ev.location}</> : null}</>
                                ) : isLastDay ? (
                                  <>Jusqu'à {formatHourShort(end)} {ev.location ? <>· {ev.location}</> : null}</>
                                ) : (
                                  <>{ev.location ? ev.location : ''}</>
                                )
                              ) : (
                                <>
                                  {formatTime(start)} - {formatTime(end)} {ev.location ? <>· {ev.location}</> : null}
                                </>
                              )}
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
    // Générer chaque jour de la plage et lister les événements qui intersectent ce jour
    const days: Date[] = [];
    const start = startOfDay(range.from);
    const end = endOfDay(range.to);
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    // Filtrer les jours qui ont des événements
    const daysWithEvents = days.filter((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayEvents = sortedEvents.filter((ev) => {
        if (ev.is_all_day) {
          // Le backend envoie maintenant les dates dans le timezone de l'utilisateur
          const eventStart = new Date(ev.starts_at);
          const eventEnd = new Date(ev.ends_at);

          // Extraire juste la partie date (sans l'heure)
          const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
          const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

          const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

          // L'événement apparaît sur tous les jours entre startDate et endDate (inclus)
          return currentDay >= startDate && currentDay <= endDate;
        } else {
          const s = new Date(ev.starts_at);
          const e = new Date(ev.ends_at);
          return e >= dayStart && s <= dayEnd;
        }
      });
      return dayEvents.length > 0;
    });

    return (
      <div className="space-y-4">
        {daysWithEvents.map((day) => {
          const dayKey = localDateKey(day);
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayEvents = sortedEvents.filter((ev) => {
            if (ev.is_all_day) {
              // Le backend envoie maintenant les dates dans le timezone de l'utilisateur
              const eventStart = new Date(ev.starts_at);
              const eventEnd = new Date(ev.ends_at);

              // Extraire juste la partie date (sans l'heure)
              const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
              const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

              const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

              // L'événement apparaît sur tous les jours entre startDate et endDate (inclus)
              return currentDay >= startDate && currentDay <= endDate;
            } else {
              const s = new Date(ev.starts_at);
              const e = new Date(ev.ends_at);
              return e >= dayStart && s <= dayEnd;
            }
          });

          return (
            <div key={dayKey} className="rounded-lg border border-border bg-card">
              <div
                className={`px-4 py-2 border-b text-sm font-medium hover:bg-accent/20 transition-colors cursor-pointer ${dragOverDayKey === dayKey ? 'ring-2 ring-gold bg-gold/10' : ''}`}
                onClick={() => { setCreateStartDate(day); setIsCreateOpen(true); }}
                onDragOver={(e) => handleDragOver(e, dayKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayKey)}
              >
                {formatDate(day)}
              </div>
              <div className="divide-y">
                {dayEvents.map((ev) => {
                  const startDt = new Date(ev.starts_at);
                  const endDt = new Date(ev.ends_at);
                  const isMultiDay = localDateKey(startDt) !== localDateKey(endDt);
                  const realFirstDayKey = localDateKey(startOfDay(startDt));
                  const realLastDayKey = localDateKey(startOfDay(endDt));
                  const displayedFirstDayKey = localDateKey(startOfDay(startDt) < startOfDay(range.from) ? startOfDay(range.from) : startOfDay(startDt));
                  const displayedLastDayKey = localDateKey(startOfDay(endDt) > startOfDay(range.to) ? startOfDay(range.to) : startOfDay(endDt));
                  const isFirstDisplayedDay = dayKey === displayedFirstDayKey;
                  const isLastDisplayedDay = dayKey === displayedLastDayKey;
                  return (
                    <div key={`${ev.id}-${dayKey}`} 
                         className="px-4 py-3 relative group hover:bg-primary/10 cursor-pointer" 
                         onClick={() => setSelectedEvent(ev)}
                         draggable
                         onDragStart={(e) => handleDragStart(e, ev)}
                    >
                      {!selected.id && (
                        <div className="mb-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="px-2 py-0.5 rounded bg-muted/10 border border-border text-xs hover:bg-muted/20 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {ev.project ? (
                                  <>
                                    {(() => {
                                      const IconComponent = getIconByValue((projects.find(p => p.id === ev.project)?.icon) || '');
                                      return IconComponent ? <span className="mr-1 inline-block"><IconComponent className="w-3 h-3" /></span> : null;
                                    })()}
                                    <span className="truncate max-w-[160px] align-middle">{projects.find(p => p.id === ev.project)?.title || `Projet #${ev.project}`}</span>
                                  </>
                                ) : (
                                  <span className="text-foreground/60">Aucun projet</span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-navy-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleAssignEventProject(ev.id, '')} className="cursor-pointer hover:bg-navy-muted">Aucun projet</DropdownMenuItem>
                              {projects.map((p) => {
                                const IconComponent = getIconByValue(p.icon);
                                return (
                                  <DropdownMenuItem key={p.id} onClick={() => handleAssignEventProject(ev.id, p.id)} className="cursor-pointer hover:bg-navy-muted">
                                    <span className="mr-2">{IconComponent ? <IconComponent className="w-4 h-4" /> : null}</span>
                                    <span>{p.title}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{ev.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {ev.is_all_day ? (
                            <>Toute la journée {ev.location ? `· ${ev.location}` : ''}</>
                          ) : isMultiDay ? (
                            isFirstDisplayedDay ? (
                              <>À {formatHourShort(startDt)} {ev.location ? `· ${ev.location}` : ''}</>
                            ) : isLastDisplayedDay ? (
                              <>Jusqu'à {formatHourShort(endDt)} {ev.location ? `· ${ev.location}` : ''}</>
                            ) : (
                              <>{ev.location ? ev.location : ''}</>
                            )
                          ) : (
                            <>
                              {formatTime(startDt)} - {formatTime(endDt)} {ev.location ? `· ${ev.location}` : ''}
                            </>
                          )}
                        </div>
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

      {/* Création d'événement (clic sur jour) */}
      <EventModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setCreateStartDate(null); }}
        event={null}
        onSubmit={async (data) => {
          await createEvent.mutateAsync(data as CreateEventData);
          setIsCreateOpen(false);
          setCreateStartDate(null);
        }}
        isLoading={createEvent?.isPending ?? false}
        initialStart={createStartDate || currentDate}
      />
    </div>
  );
};

export default EventsCalendar;


