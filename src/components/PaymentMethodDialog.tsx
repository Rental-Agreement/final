import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddPaymentMethod } from "@/hooks/use-payments";
import { CreditCard, Smartphone, Building2 } from "lucide-react";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function PaymentMethodDialog({ open, onOpenChange, userId }: PaymentMethodDialogProps) {
  const [methodType, setMethodType] = useState<"UPI" | "Card" | "Bank">("UPI");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [isAutoPay, setIsAutoPay] = useState(false);
  
  const addPaymentMethod = useAddPaymentMethod();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addPaymentMethod.mutateAsync({
      user_id: userId,
      method_type: methodType,
      last_four_digits: lastFourDigits,
      is_auto_pay: isAutoPay,
      token: `mock_token_${Date.now()}`, // In production, this would be from payment gateway
    });

    onOpenChange(false);
    setLastFourDigits("");
    setIsAutoPay(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method for rent payments
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="method-type">Payment Method Type</Label>
              <Select value={methodType} onValueChange={(value: any) => setMethodType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="Card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="Bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last-four">Last 4 Digits</Label>
              <Input
                id="last-four"
                placeholder="1234"
                maxLength={4}
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-pay"
                checked={isAutoPay}
                onCheckedChange={(checked) => setIsAutoPay(checked as boolean)}
              />
              <Label htmlFor="auto-pay" className="text-sm font-normal">
                Enable auto-pay for recurring payments
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPaymentMethod.isPending}>
              {addPaymentMethod.isPending ? "Adding..." : "Add Payment Method"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
