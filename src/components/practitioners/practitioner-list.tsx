import { useState } from "react";
import { PractitionerCard } from "./practitioner-card";
import { PractitionerDialog } from "./practitioner-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PractitionerListProps {
  practitioners: any[];
  onRefresh: () => void;
}

export function PractitionerList({ practitioners, onRefresh }: PractitionerListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractitioner, setEditingPractitioner] = useState<any>(null);

  const handleEdit = (practitioner: any) => {
    setEditingPractitioner(practitioner);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPractitioner(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {practitioners.map((p) => (
          <PractitionerCard
            key={p.id}
            practitioner={p}
            onEdit={() => handleEdit(p)}
            onRefresh={onRefresh}
            allPractitioners={practitioners}
          />
        ))}
      </div>

      <PractitionerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        practitioner={editingPractitioner}
        onSuccess={onRefresh}
      />
    </div>
  );
}
