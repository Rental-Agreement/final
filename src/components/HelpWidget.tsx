import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Simulate sending message
    toast({ 
      title: "Message sent!", 
      description: "Our team will respond shortly." 
    });
    setMessage("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-2xl transition-all duration-300 ${
          isOpen 
            ? "bg-destructive text-destructive-foreground" 
            : "bg-primary text-primary-foreground hover:scale-110"
        }`}
        aria-label="Help"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground p-4">
            <h3 className="font-semibold text-lg">How can we help?</h3>
            <p className="text-sm opacity-90">We typically reply in a few minutes</p>
          </div>
          
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Quick Help Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {["Booking help", "Payment issues", "Cancellation", "Property inquiry"].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setMessage(topic)}
                    className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                className="w-full"
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>

            {/* Contact Options */}
            <div className="pt-4 border-t text-center text-sm text-muted-foreground">
              <p>Or email us at <a href="mailto:support@tenanttown.com" className="text-primary hover:underline">support@tenanttown.com</a></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
