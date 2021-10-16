declare interface ToastEvent {
  intent: 'danger' | 'success';
  message: string;
}

declare interface ToastMessage extends ToastEvent {
  id: number;
}
