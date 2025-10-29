import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, ThumbsUp, User, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  user_name: string;
  user_avatar?: string;
  question: string;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  asked_at: string;
  likes: number;
  isOwner?: boolean;
}

interface PropertyQAProps {
  propertyId: string;
  ownerId: string;
  questions?: Question[];
}

// Mock data
const mockQuestions: Question[] = [
  {
    id: "1",
    user_name: "Rahul Sharma",
    question: "Is parking included in the rent?",
    answer: "Yes, one covered parking space is included. Additional parking available for ₹1000/month.",
    answered_by: "Property Owner",
    answered_at: "2 days ago",
    asked_at: "3 days ago",
    likes: 12,
    isOwner: true,
  },
  {
    id: "2",
    user_name: "Priya Patel",
    question: "Are pets allowed in the property?",
    answer: "Small pets are allowed with prior approval and a refundable pet deposit of ₹5000.",
    answered_by: "Property Owner",
    answered_at: "1 week ago",
    asked_at: "1 week ago",
    likes: 8,
    isOwner: true,
  },
  {
    id: "3",
    user_name: "Amit Kumar",
    question: "What is the minimum lease duration?",
    asked_at: "1 day ago",
    likes: 3,
  },
  {
    id: "4",
    user_name: "Sneha Gupta",
    question: "Is there a gym or fitness center in the building?",
    answer: "Yes, there's a fully equipped gym on the ground floor, available 24/7 for all residents.",
    answered_by: "Property Owner",
    answered_at: "5 days ago",
    asked_at: "5 days ago",
    likes: 15,
    isOwner: true,
  },
];

export function PropertyQA({ propertyId, ownerId, questions = mockQuestions }: PropertyQAProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      toast({ title: "Please enter a question", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ 
      title: "Question submitted!", 
      description: "The property owner will respond soon.",
    });
    setNewQuestion("");
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Questions & Answers
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions and get answers from the property owner
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ask Question */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Have a question?</h4>
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about parking, pets, amenities, lease terms..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <Button 
            onClick={handleSubmitQuestion}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Ask Question"}
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{questions.length} Questions</h4>
            <Badge variant="outline">
              {questions.filter(q => q.answer).length} Answered
            </Badge>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {questions.map((q) => (
              <div key={q.id} className="space-y-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                {/* Question */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={q.user_avatar} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{q.user_name}</span>
                      <span className="text-xs text-muted-foreground">{q.asked_at}</span>
                    </div>
                    <p className="text-sm">{q.question}</p>
                  </div>
                </div>

                {/* Answer */}
                {q.answer && (
                  <div className="ml-11 pl-4 border-l-2 border-primary/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm text-green-600">
                        {q.answered_by}
                      </span>
                      {q.isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{q.answered_at}</span>
                    </div>
                    <p className="text-sm bg-green-50 p-3 rounded-lg">{q.answer}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 ml-11">
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span className="text-xs">{q.likes} helpful</span>
                  </Button>
                  {!q.answer && (
                    <Badge variant="outline" className="text-xs">
                      Awaiting response
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Tip:</strong> Questions and answers are public and help other users make informed decisions. Be respectful and specific in your questions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
