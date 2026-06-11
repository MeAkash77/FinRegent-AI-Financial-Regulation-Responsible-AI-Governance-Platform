import { toast as sonnerToast } from "sonner";

export const useToast = () => {
    const toast = ({
        title,
        description,
        variant = "default",
    }: {
        title: string;
        description?: string;
        variant?: "default" | "destructive";
    }) => {
        if (variant === "destructive") {
            sonnerToast.error(title, {
                description,
            });
        } else {
            sonnerToast(title, {
                description,
            });
        }
    };

    return { toast };
};
