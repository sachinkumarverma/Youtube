export {};

declare global {
    interface Window {
        puter: {
            ai: {
                chat: (messages: any, options?: { model?: string }) => Promise<any>;
                txt2img: (prompt: string, options?: { model?: string }) => Promise<HTMLImageElement>;
            };
        };
    }
}
