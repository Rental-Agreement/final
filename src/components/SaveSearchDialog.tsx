import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSaveSearch } from "@/hooks/use-saved-searches";
import { Bell } from "lucide-react";

interface SaveSearchDialogProps {
  currentFilters: Record<string, any>;
  trigger?: React.ReactNode;
}

export function SaveSearchDialog({ currentFilters, trigger }: SaveSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(false);
  const saveSearch = useSaveSearch();

  const handleSave = () => {
    if (!name.trim()) return;
    
    saveSearch.mutate(
      { name: name.trim(), filters: currentFilters, emailAlerts },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEmailAlerts(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="w-4 h-4" />
            Save Search
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save This Search</DialogTitle>
          <DialogDescription>
            Get notified when new properties match your criteria
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              placeholder="e.g., 2BHK in Mumbai under ₹30k"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when new properties match
              </p>
            </div>
            <Switch
              id="email-alerts"
              checked={emailAlerts}
              onCheckedChange={setEmailAlerts}
            />
          </div>
          
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!name.trim() || saveSearch.isPending}
          >
            {saveSearch.isPending ? "Saving..." : "Save Search"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
