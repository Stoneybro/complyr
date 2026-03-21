import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, Loader2 } from "lucide-react";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSubmit: (e?: React.FormEvent) => void;
    isTransactionPending: boolean;
    isLoading: boolean;
}

export function ChatInput({
    input,
    setInput,
    handleSubmit,
    isTransactionPending,
    isLoading
}: ChatInputProps) {
    return (
        <div className="w-full max-w-2xl mx-auto sticky bottom-0 z-10">
            <InputGroup className="bg-white rounded-lg">
                <InputGroupTextarea
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    placeholder='Try: "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"'
                    disabled={isTransactionPending || isLoading}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    rows={2}
                />
                <InputGroupAddon align={"block-end"}>
                    <InputGroupButton
                        variant='default'
                        className='rounded-full'
                        size='icon-xs'
                        onClick={() => handleSubmit()}
                        disabled={isTransactionPending || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUpIcon />
                        )}
                        <span className='sr-only'>Send</span>
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
