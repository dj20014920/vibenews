import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserX } from 'lucide-react';

interface AnonymousToggleProps {
  isAnonymous: boolean;
  onToggle: (anonymous: boolean) => void;
  className?: string;
}

export const AnonymousToggle: React.FC<AnonymousToggleProps> = ({
  isAnonymous,
  onToggle,
  className = ""
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <UserX className="h-4 w-4 text-muted-foreground" />
      <Label 
        htmlFor="anonymous-mode" 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        익명으로 작성
      </Label>
      <Switch
        id="anonymous-mode"
        checked={isAnonymous}
        onCheckedChange={onToggle}
      />
    </div>
  );
};