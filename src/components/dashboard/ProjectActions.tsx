import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  projectName: string;
}

export const ProjectActions: React.FC<ProjectActionsProps> = ({
  onEdit,
  onDelete,
  projectName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-card/80 hover:bg-navy-muted border border-border hover:border-gold"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="bg-navy-card border-border text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={onEdit}
          className="hover:bg-navy-muted focus:bg-navy-muted cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-navy-muted focus:bg-navy-muted cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

