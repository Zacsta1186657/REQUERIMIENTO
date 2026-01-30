import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = title || description || '';
    const details = title && description ? description : undefined;

    if (variant === 'destructive') {
      sonnerToast.error(message, {
        description: details,
      });
    } else {
      sonnerToast.success(message, {
        description: details,
      });
    }
  };

  return { toast };
}
