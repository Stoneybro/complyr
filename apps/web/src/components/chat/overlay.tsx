import React, { useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BsArrowUpRight, BsArrowRepeat } from "react-icons/bs";
import { FaUsers, FaUsersGear } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { TemplateDialog, TemplateType } from './TemplateDialog';

interface OverlayProps {
  setInput: (value: string) => void;
  walletAddress?: string;
}

function Overlay({ setInput, walletAddress }: OverlayProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateType, setTemplateType] = useState<TemplateType>('SINGLE');

  const openTemplate = (type: TemplateType) => {
    setTemplateType(type);
    setDialogOpen(true);
  };

  const handleTemplateSubmit = (templateString: string) => {
    setInput(templateString);
  };

  return (
    <>
      <div className="absolute left-1/2 -translate-x-1/2 top-5 w-[90%] md:w-[70%] lg:w-[60%] flex flex-col gap-6">
        <div className="text-2xl font-semibold text-center">what would you like to do?</div>

        {/* NEW NOTE AS REQUESTED */}
        <Alert>
          <Info className="h-4 w-4 mb-4" />
          <AlertTitle >
            Use the templates below or the form for the most reliable payment experience.
          </AlertTitle>
        </Alert>

        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs w-full">
          <Card
            className="@container/card cursor-pointer hover:bg-muted/50 transition-colors p-0 gap-0"
            onClick={() => openTemplate('SINGLE')}
          >
            <CardHeader className="p-3 pb-1">
              <CardTitle>
                <Badge variant="outline">
                  Send
                </Badge>
              </CardTitle>
              <CardAction>
                <BsArrowUpRight />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 p-3 pt-0 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                single payment
              </div>
              <div className="text-muted-foreground text-xs">
                transfer funds to a single recipient
              </div>
            </CardFooter>
          </Card>

          <Card
            className="@container/card cursor-pointer hover:bg-muted/50 transition-colors p-0 gap-0"
            onClick={() => openTemplate('BATCH')}
          >
            <CardHeader className="p-3 pb-1">
              <CardTitle>
                <Badge variant="outline">
                  bulk send
                </Badge>
              </CardTitle>
              <CardAction>
                <FaUsers />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 p-3 pt-0 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Batch Payment
              </div>
              <div className="text-muted-foreground text-xs">
                distribute payment to multiple people at once
              </div>
            </CardFooter>
          </Card>

          <Card
            className="@container/card cursor-pointer hover:bg-muted/50 transition-colors p-0 gap-0"
            onClick={() => openTemplate('RECURRING')}
          >
            <CardHeader className="p-3 pb-1">
              <CardTitle>
                <Badge variant="outline">
                  create subscription
                </Badge>
              </CardTitle>
              <CardAction>
                <BsArrowRepeat />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 p-3 pt-0 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Single Recurring Payment
              </div>
              <div className="text-muted-foreground text-xs">
                Set up a recurring transfer to one address
              </div>
            </CardFooter>
          </Card>

          <Card
            className="@container/card cursor-pointer hover:bg-muted/50 transition-colors p-0 gap-0"
            onClick={() => openTemplate('BATCH_RECURRING')}
          >
            <CardHeader className="p-3 pb-1">
              <CardTitle>
                <Badge variant="outline">
                  run payroll
                </Badge>
              </CardTitle>
              <CardAction>
                <FaUsersGear />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 p-3 pt-0 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Batch Recurring Payment
              </div>
              <div className="text-muted-foreground text-xs">
                Set up recurring payments for teams or groups
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={templateType}
        onSubmit={handleTemplateSubmit}
        walletAddress={walletAddress}
      />
    </>
  )
}

export default Overlay