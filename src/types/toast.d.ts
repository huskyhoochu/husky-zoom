declare interface ToastEvent {
  intent: 'danger' | 'success';
  title: string;
  message: string;
}

declare interface ToastMessage extends ToastEvent {
  id: number;
}
