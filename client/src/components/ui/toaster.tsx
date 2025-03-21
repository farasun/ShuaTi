import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="bg-green-50 border border-green-100 text-green-800"
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-green-700">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-green-600 hover:text-green-800" />
          </Toast>
        );
      })}
      <ToastViewport className="top-0 right-0 flex-col fixed p-4" />
    </ToastProvider>
  );
}