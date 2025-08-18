import React from 'react';
import { 
  Briefcase, 
  Utensils, 
  Building2, 
  Laptop, 
  Heart, 
  Zap 
} from 'lucide-react';

const projects = [
  { id: 1, name: 'Aerodyne', icon: Zap },
  { id: 2, name: 'Gourmet Express', icon: Utensils },
  { id: 3, name: 'Corporate HQ', icon: Building2 },
  { id: 4, name: 'Tech Solutions', icon: Laptop },
  { id: 5, name: 'Health Care', icon: Heart },
  { id: 6, name: 'Business Dev', icon: Briefcase }
];

export const ProjectsGrid = () => {
  const handleProjectClick = (project: typeof projects[0]) => {
    // Mock behavior - open project dashboard
    console.log('Opening project:', project.name);
  };

  return (
    <section className="animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Projets
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => {
          const IconComponent = project.icon;
          return (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="flex flex-col items-center gap-3 p-4 bg-navy-card rounded-xl border border-border hover:border-gold transition-smooth animate-press"
            >
              <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-gold" />
              </div>
              <span className="text-sm text-foreground font-medium text-center">
                {project.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};